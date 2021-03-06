import m from 'mithril';
import { set, get } from 'lodash';
import { DB } from '../config';
import store from '../../../data/store';
import { concatenateDBPath, uniqueId, getRandomColor } from '../../general';
import { subscribeUser } from './setChats';


function createGroup(settings) {
    try {
        const { creatorId, title, description, callForAction, language } = settings;
        console.log(creatorId, title, description, callForAction, language)
        const groupId = uniqueId()

        DB
            .collection('groups')
            .doc(groupId)
            .set({
                title,
                description,
                creatorId,
                time: new Date().getTime(),
                groupId,
                id: groupId,
                groupColor: getRandomColor(),
                callForAction,
                language
            })
            .then(() => {

                DB
                    .collection("users")
                    .doc(store.user.uid)
                    .collection("groupsOwned")
                    .doc(groupId).set({ id: groupId, date: new Date().getTime() })
                    .then(() => { console.info(`added the group to the groups the user owns`) })
                    .catch(e => { console.error(e); sendError(e) });

                subscribeUser({ groupId, subscribe: false })
                m.route.set(`/group/${groupId}`);
            })
            .catch(function (error) {
                console.error('Error adding document: ', error);
                sendError(e)
            });
    } catch (e) {
        console.error(e); sendError(e)
    }
}

function updateGroup(vnode) {
    try {
        console.log(vnode.state)

        DB
            .collection('groups')
            .doc(vnode.attrs.id)
            .update({ title: vnode.state.title, description: vnode.state.description, callForAction: vnode.state.callForAction || '' })
            .then(() => { m.route.set(`/group/${vnode.attrs.id}`) })
            .catch(err => { throw err })
    } catch (e) {
        console.error(e); sendError(e)
    }
}

function registerGroup(groupId) {


    try {



        let isUserRgisterdToGroup = get(store.user, `.groupsUserTryToRegister[${groupId}]`, false);

        if (!isUserRgisterdToGroup) {
            // store.user.groupsUserTryToRegister[groupId] = true;
            set(store.user, `.groupsUserTryToRegister[${groupId}]`, true)

            const waitForUser = setInterval(() => {



                if ({}.hasOwnProperty.call(store.user, 'uid')) {

                    clearInterval(waitForUser);



                    if (!isUserRgisterdToGroup) {



                        store.groupsRegistered[groupId] = true;

                        DB.collection('users').doc(store.user.uid)
                            .collection('registerGroups').doc(groupId)
                            .set({ register: true })
                            .then(() => { console.info('user registerd to group', groupId) })
                            .catch(e => { console.error(e); sendError(e) })

                        //store data from use as member in the group
                        const { displayName, email, uid, name, photoURL, phoneNumber, isAnonymous } = store.user;
                        const userObjTemp = { displayName, email, uid, name, photoURL, phoneNumber, isAnonymous }, userObj = {};


                        for (let prop in userObjTemp) {
                            if (userObjTemp[prop] !== null && userObjTemp[prop] !== undefined) {
                                userObj[prop] = userObjTemp[prop]
                            }
                        }


                        DB.collection('groups').doc(groupId)
                            .collection('members').doc(store.user.uid)
                            .set(userObj, { merge: true })
                            .then(() => { console.info('user is a member of group', groupId) })
                            .catch(e => { console.error(e); sendError(e) })
                    } else {
                        console.info('user is already registered to', groupId)
                    }
                }

            }, 1000);
        }
    } catch (e) {
        console.error(e); sendError(e)

    }
}



function createSubQuestion(groupId, questionId, title, order) {
    try {
        return new Promise((resolve, reject) => {
            const subQuestionId = uniqueId()

            DB
                .collection('groups')
                .doc(groupId)
                .collection('questions')
                .doc(questionId)
                .collection('subQuestions')
                .doc(subQuestionId)
                .set({ title, order, creator: store.user.uid, orderBy: 'top', subQuestionId, id: subQuestionId })
                .then(() => { resolve(subQuestionId) })
                .catch(function (error) {
                    console.error('Error adding document: ', error); sendError(e)
                    reject(undefined)
                });
        })
    } catch (e) {
        console.error(e); sendError(e);
        reject(undefined)
    }
}

function updateSubQuestion(groupId, questionId, subQuestionId, title) {
    DB
        .collection('groups')
        .doc(groupId)
        .collection('questions')
        .doc(questionId)
        .collection('subQuestions')
        .doc(subQuestionId)
        .update({ title });
}

function updateSubQuestionProcess(groupId, questionId, subQuestionId, processType) {
    DB
        .collection('groups')
        .doc(groupId)
        .collection('questions')
        .doc(questionId)
        .collection('subQuestions')
        .doc(subQuestionId)
        .update({ processType });
}

function updateSubQuestionOrderBy(groupId, questionId, subQuestionId, orderBy) {
    DB
        .collection('groups')
        .doc(groupId)
        .collection('questions')
        .doc(questionId)
        .collection('subQuestions')
        .doc(subQuestionId)
        .update({ orderBy });
}

function setSubQuestion(ids, settings) {
    try {
        return new Promise((resolve, reject) => {
            const { title, processType, orderBy, userHaveNavigation, showSubQuestion, numberOfSubquestions, proAgainstType } = settings;
            const { groupId, questionId, subQuestionId } = ids;


            const subQuestionRef = DB
                .collection('groups')
                .doc(groupId)
                .collection('questions')
                .doc(questionId)
                .collection('subQuestions')



            if (subQuestionId === undefined) {
                //new subQuestion
                const uid = uniqueId()

                subQuestionRef.doc(uid).set({ title, processType, orderBy, groupId, questionId, subQuestionId: uid, userHaveNavigation, showSubQuestion, order: numberOfSubquestions, proAgainstType, creator: store.user.uid })
                    .then(() => { console.info(`saved subQuestion ${uid} to DB`); resolve(uid) })
                    .catch(e => {
                        console.error(e); sendError(e)
                        reject(undefined)
                    })
            } else {
                subQuestionRef.doc(subQuestionId).update({ title, processType, orderBy, groupId, questionId, subQuestionId, userHaveNavigation, showSubQuestion, proAgainstType })
                    .then(() => { console.info(`updated subQuestion ${subQuestionId} to DB`); resolve(subQuestionId) })
                    .catch(e => {
                        console.error(e); sendError(e);
                        reject(undefined);
                    })
            }
        })
    } catch (e) {
        console.error(e); sendError(e)
    }



}

function deleteSubQuestion(groupId, questionId, subQuestionId) {
    try {
        DB.collection('groups')
            .doc(groupId)
            .collection('questions')
            .doc(questionId)
            .collection('subQuestions')
            .doc(subQuestionId)
            .update({ showSubQuestion: 'deleted' })
            .then(() => { console.info('SubQuestion was deleted (and styed in db as subQuestion', subQuestionId, ')') })
            .catch(e => { console.error(e); sendError(e) })
    } catch (e) {
        console.error(e); sendError(e)
    }

}

function updateDoesUserHaveNavigation(groupId, questionId, subQuestionId, userHaveNavigation) {
    try {
        DB
            .collection('groups')
            .doc(groupId)
            .collection('questions')
            .doc(questionId)
            .collection('subQuestions')
            .doc(subQuestionId)
            .update({ userHaveNavigation })
            .catch(e => {
                console.error(e); sendError(e)
            });
    } catch (e) {
        console.error(e); sendError(e)
    }

}

function updateSubQuestionsOrder(groupId, questionId, newOrderArray) {
    DB
        .collection('groups')
        .doc(groupId)
        .collection('questions')
        .doc(questionId)
        .update({
            subQuestions: {
                order: newOrderArray
            }
        })
        .then((something) => {
            console.info('writen succesufuly');
        })
        .catch(function (error) {
            console.error('Error adding document: ', error); sendError(e)
        });
}

function setSubQuestionsOrder(groupId, questionId, subQuestionId, order) {
    try {
        DB
            .collection('groups')
            .doc(groupId)
            .collection('questions')
            .doc(questionId)
            .collection('subQuestions')
            .doc(subQuestionId)
            .update({ order })
            .then((something) => {
                console.info(`writen to ${subQuestionId} succesufuly`);
            })
            .catch(function (error) {
                console.error('Error adding document: ', error); sendError(e)
            });
    } catch (e) {
        console.error(e); sendError(e)
    }
}

function createOption(groupId, questionId, subQuestionId, type, creatorId, title, description, creatorName, subQuestionTitle, isVote = false) {

    const optionId = uniqueId();
    try {


        let optionRef = DB
            .collection('groups')
            .doc(groupId)
            .collection('questions')
            .doc(questionId)
            .collection('subQuestions')
            .doc(subQuestionId)
            .collection('options');

        optionRef.doc(optionId).set({
            groupId,
            questionId,
            subQuestionId,
            optionId,
            id: optionId,
            creatorId,
            type,
            title,
            description,
            creatorName,
            subQuestionTitle,
            time: firebase
                .firestore
                .FieldValue
                .serverTimestamp(),
            consensusPrecentage: 0,
            isActive: true,
            isVote
        }).catch(function (error) {
            console.error('Error adding document: ', error); sendError(e)
        });

        return optionId;
    } catch (e) {
        console.error(e); sendError(e);
        return false;
    }
}

function voteOption(ids, settings) {
    try {
        const { groupId, questionId, subQuestionId, optionId } = ids;

        const { addVote } = settings;


        const optionRef = DB
            .collection('groups')
            .doc(groupId)
            .collection('questions')
            .doc(questionId)
            .collection('subQuestions')
            .doc(subQuestionId)
            .collection('votes')
            .doc(store.user.uid);

        const updateObj = {
            optionVoted: optionId,
            voter: {
                voterId: store.user.uid,
                name: store.user.name,
                photoURL: store.user.photoURL || ""
            }
        }

        if (addVote) {
            optionRef.update(updateObj)
                .then(() => { console.info(`Option ${optionId} was voted for`) })
                .catch(e => {
                    // console.error(e); sendError(e)

                    let errRexExp = new RegExp('No document to update');
                    if (errRexExp.test(e.message)) {
                        optionRef.set(updateObj)
                            .then(() => { console.log(`A vote to option ${optionId} was added`) })
                            .catch(e => { console.error(e); sendError(e) })
                    } else {
                        console.error(e); sendError(e)

                    }
                })
        } else {
            optionRef.delete()
                .then(() => { console.info(`Option ${optionId} was deleted`) })
                .catch(e => { console.error(e); sendError(e) })
        }


    } catch (e) {
        console.error(e); sendError(e)
    }
}

function createConsequence(groupId, questionId, subQuestionId, optionId, creatorId, title, description, goodBad, creatorName) {
    try {

        const consequenceId = uniqueId();

        const consequenceRef = DB
            .collection('groups')
            .doc(groupId)
            .collection('questions')
            .doc(questionId)
            .collection('subQuestions')
            .doc(subQuestionId)
            .collection('options')
            .doc(optionId)
            .collection('consequences')
            .doc(consequenceId);

        consequenceRef
            .set({
                groupId,
                questionId,
                subQuestionId,
                optionId,
                consequenceId,
                creatorId,
                title,
                description,
                creatorName,
                time: firebase
                    .firestore
                    .FieldValue
                    .serverTimestamp(),
                consensusPrecentage: 0,
                isActive: true
            })
            .then(() => {

                voteConsequence({ groupId, questionId, subQuestionId, optionId, consequenceId }, 1, goodBad)

                console.info('consequence', consequenceId, 'was saved')
            })
            .catch(e => { console.error(e); sendError(e) })
    } catch (e) {
        console.error(e); sendError(e)
    }

}

function voteConsequence(ids, truthiness, evaluation) {
    try {

        const { groupId, questionId, subQuestionId, optionId, consequenceId } = ids;

        if (truthiness === undefined) throw new Error('No truthiness in voteConsequence', truthiness);
        if (evaluation === undefined) throw new Error('No evaluation in voteConsequence', evaluation);

        if (isNaN(truthiness)) throw new Error('truthiness is not a number', value);
        if (truthiness < 0 || truthiness > 1) throw new Error('truthiness is out of range (0 -->1):', truthiness);

        if (isNaN(evaluation)) throw new Error('evaluation is not a number', value);
        if (evaluation < -1 || evaluation > 1) throw new Error('evaluation is out of range (-1 --> 1):', evaluation);


        const userId = store.user.uid


        DB
            .collection('groups')
            .doc(groupId)
            .collection('questions')
            .doc(questionId)
            .collection('subQuestions')
            .doc(subQuestionId)
            .collection('options')
            .doc(optionId)
            .collection('consequences')
            .doc(consequenceId)
            .collection('voters')
            .doc(userId)
            .set({
                truthiness,
                evaluation,
                userId,
                time: firebase
                    .firestore
                    .FieldValue
                    .serverTimestamp()
            }, { merge: true })
            .then(() => { console.info('consequence', consequenceId, 'was voted') })
            .catch(e => { console.error(e); sendError(e) })
    } catch (e) {
        console.error(e); sendError(e)
    }
}

function setOptionActive(groupId, questionId, subQuestionId, optionId, isActive) {



    try {
        DB
            .collection('groups')
            .doc(groupId)
            .collection('questions')
            .doc(questionId)
            .collection('subQuestions')
            .doc(subQuestionId)
            .collection('options')
            .doc(optionId)
            .update({ isActive })
    } catch (err) {
        console.error(err)
    }

}

function updateOptionDescription(ids, description) {
    try {
        const { groupId, questionId, subQuestionId, optionId } = ids;

        DB
            .collection('groups')
            .doc(groupId)
            .collection('questions')
            .doc(questionId)
            .collection('subQuestions')
            .doc(subQuestionId)
            .collection('options')
            .doc(optionId)
            .update({ description })
            .then(() => {
                console.info(`a description was updated on option ${optionId}`)
            })
            .catch(e => {
                console.error(e); sendError(e)
            })

    } catch (e) {
        console.error(e); sendError(e)
    }
}

function setLike(groupId, questionId, subQuestionId, optionId, creatorId, like) {


    try {


        if (groupId === undefined || questionId === undefined || subQuestionId === undefined || optionId === undefined || creatorId === undefined) throw new Error("One of the Ids groupId, questionId, subQuestionId, optionId, creatorId is missing", groupId, questionId, subQuestionId, optionId, creatorId)

        DB
            .collection('groups')
            .doc(groupId)
            .collection('questions')
            .doc(questionId)
            .collection('subQuestions')
            .doc(subQuestionId)
            .collection('options')
            .doc(optionId)
            .collection('likes')
            .doc(creatorId)
            .set({ like })
            .catch(function (error) {
                console.error('Error adding document: ', error); sendError(e)
            });
    } catch (e) {
        console.error(e); sendError(e)
    }
}




function setMessage(groupId, questionId, subQuestionId, optionId, creatorId, creatorName, message, groupName, questionName, optionName) {
    DB
        .collection('groups')
        .doc(groupId)
        .collection('questions')
        .doc(questionId)
        .collection('subQuestions')
        .doc(subQuestionId)
        .collection('options')
        .doc(optionId)
        .collection('messages')
        .add({
            creatorId,
            creatorName,
            time: firebase
                .firestore
                .FieldValue
                .serverTimestamp(),
            timeSeconds: new Date().getTime(),
            message,
            type: 'messages',
            groupName,
            questionName,
            optionName
        })
        .then((messageDB) => {
            DB
                .collection('groups')
                .doc(groupId)
                .collection('questions')
                .doc(questionId)
                .collection('subQuestions')
                .doc(subQuestionId)
                .collection('options')
                .doc(optionId)
                .update({
                    lastMessage: firebase
                        .firestore
                        .FieldValue
                        .serverTimestamp()
                })
                .catch(e => {
                    console.error(e); sendError(e)
                })
        })
        .catch((error) => {
            console.error('Error:', error); sendError(e)
        });
}

function createSubItem(subItemsType, groupId, questionId, creatorId, creatorName, title, description) {
    let subQuestionRef = DB
        .collection('groups')
        .doc(groupId)
        .collection('questions')
        .doc(questionId)
        .collection(subItemsType);

    let addObj = {
        groupId,
        questionId,
        creatorId,
        title,
        description,
        author: creatorName,
        time: firebase
            .firestore
            .FieldValue
            .serverTimestamp(),
        consensusPrecentage: 0,
        roles: {},
        totalVotes: 0
    };
    addObj.roles[creatorId] = 'owner';

    subQuestionRef
        .add(addObj)
        .then((newItem) => { })
        .catch(function (error) {
            console.error('Error adding document: ', error); sendError(e)
        });
}

function updateSubItem(subItemsType, groupId, questionId, subQuestionId, title, description) {
    let subQuestionRef = DB
        .collection('groups')
        .doc(groupId)
        .collection('questions')
        .doc(questionId)
        .collection(subItemsType)
        .doc(subQuestionId);

    let updateObj = {
        title,
        description,
        time: firebase
            .firestore
            .FieldValue
            .serverTimestamp()
    };

    subQuestionRef
        .update(updateObj)
        .then((newOption) => { })
        .catch(function (error) {
            console.error('Error updating document: ', error); sendError(e)
        });
}

function setLikeToSubItem(subItemsType, groupId, questionId, subQuestionId, creatorId, isUp) {

    console.log(subItemsType, groupId, questionId, subQuestionId)
    let subQuestionRef = DB
        .collection('groups')
        .doc(groupId)
        .collection('questions')
        .doc(questionId)
        .collection(subItemsType)
        .doc(subQuestionId)
        .collection('likes')
        .doc(creatorId);

    if (isUp) {
        subQuestionRef.set({ like: 1 });

    } else {
        subQuestionRef.set({ like: 0 });

    }
}

function setSubAnswer(groupId, questionId, subQuestionId, creatorId, creatorName, message) {
    DB
        .collection('groups')
        .doc(groupId)
        .collection('questions')
        .doc(questionId)
        .collection('subQuestions')
        .doc(subQuestionId)
        .collection('subAnswers')
        .add({
            groupId,
            questionId,
            subQuestionId,
            creatorId,
            author: creatorName,
            creatorId,
            time: firebase
                .firestore
                .FieldValue
                .serverTimestamp(),
            message
        })
        .then((newLike) => { })
        .catch(function (error) {
            console.error('Error adding document: ', error); sendError(e)
        });
}

//add a path ([collection1, doc1, collection2, doc2, etc])
function addToFeed(addRemove, pathArray, refString, collectionOrDoc) {
    if (addRemove == 'add') {
        DB
            .collection('users')
            .doc(store.user.uid)
            .collection('feeds')
            .doc(refString)
            .set({
                path: refString,
                time: new Date().getTime(),
                type: collectionOrDoc,
                refString
            })
            .then(() => {

                store.subscribed[refString] = true;
                console.dir(store.subscribed);
            })
            .catch((error) => {
                console.error('Error writing document: ', error); sendError(e)
            });
    } else {
        DB
            .collection('users')
            .doc(store.user.uid)
            .collection('feeds')
            .doc(refString)
            .delete()
            .then(function () {
                delete store.subscribed[refString];
            })
            .catch(function (error) {
                console.error('Error removing document: ', error); sendError(e)
            });
    }
}

function setToFeedLastEntrance() {
    try {
        DB.collection('users').doc(store.user.uid).collection('feedLastEntrence').doc('info')
            .set({ lastEntrance: new Date().getTime() })
            .catch(err => { console.error(err) });
    } catch (err) {
        console.error(err)
    }
}


function updateOption(vnode) {
    const { groupId, questionId, subQuestionId, optionId } = vnode.attrs.ids;
    try {
        let creatorName = vnode.state.isNamed
            ? vnode.state.creatorName
            : 'אנונימי/ת'
        DB
            .collection('groups')
            .doc(groupId)
            .collection('questions')
            .doc(questionId)
            .collection('subQuestions')
            .doc(subQuestionId)
            .collection('options')
            .doc(optionId)
            .update({
                creatorUid: store.user.uid,
                creatorName,
                title: vnode.state.title,
                description: vnode.state.description,

            })
            .catch(e => {
                console.error(e); sendError(e);
            })
    } catch (e) {
        console.error(e); sendError(e)
    }
}





function setNotifications(ids, isSubscribed) {

    try {

        const { groupId, questionId, subQuestionId, optionId } = ids;

        const path = `${concatenateDBPath(groupId, questionId, subQuestionId, optionId)}/notifications/${store.user.uid}`;

        if (isSubscribed) {
            DB.doc(path).set({ username: store.user.name, email: store.user.email || null }).catch(e => { console.error(e); sendError(e) })
        } else {
            DB.doc(path).delete().catch(e => { console.error(e); sendError(e) })
        }
    } catch (e) {
        console.error(e); sendError(e)
    }


}


function setNumberOfMessagesMark(ids, numberOfMessages = 0) {

    try {
        const { optionId } = ids;
        if (optionId === undefined) throw new Error("option doesnt have optionId")

        DB.collection('users')
            .doc(store.user.uid)
            .collection('optionsRead')
            .doc(optionId)
            .set({ numberOfMessages })
            .catch(e => { console.error(e); sendError(e) })

    } catch (e) {
        console.error(e); sendError(e)
    }
}



function dontShowPopAgain() {
    try {
        DB.collection('users').doc(store.user.uid).update({ stopRegistrationMessages: true })
            .then(() => console.info('user will not recive pop messages again'))
            .catch(e => { console.error(e); sendError(e); })
    } catch (e) {
        console.error(e); sendError(e)
    }
}

function markUserSeenSuggestionsWizard() {
    try {
        DB.collection('users').doc(store.user.uid)
            .update({ firstTimeOnSuggestions: false })
            .then(() => { console.info('user seen wizared') })
            .catch(e => { console.error(e); sendError(e) })
    } catch (e) {
        console.error(e); sendError(e)
    }
}



function handleSubscription(vnode) {

    try {

        //path for subscription object
        const { groupId, questionId, subQuestionId, optionId } = vnode.attrs;
        console.log(groupId, questionId, subQuestionId, optionId)
        const path = concatenateDBPath(groupId, questionId, subQuestionId, optionId);

        subscribeUser({
            groupId, questionId, subQuestionId, optionId, subscribe: vnode.state.subscribed
        })

        if (vnode.state.subscribed == false) {

            vnode.state.subscribed = true;
            set(store.subscribe, `[${path}]`, true)
        } else {

            vnode.state.subscribed = false;
            set(store.subscribe, `[${path}]`, false)
        }
    } catch (e) {
        console.error(e); sendError(e)
    }
}

function sendError(e) {
    try {
        DB.collection('errors').add({
            message: e.message,
            user: store.user, date: firebase
                .firestore
                .FieldValue
                .serverTimestamp()
        })
            .catch(e => {
                console.error(e);
            })
    } catch (e) {
        console.error(e);
    }
}


module.exports = {
    updateOption,
    addToFeed,
    createGroup,
    updateGroup,
    registerGroup,
    createSubQuestion,
    updateSubQuestion,
    setSubQuestion,
    deleteSubQuestion,
    setSubQuestionsOrder,
    createOption,
    voteOption,
    updateOptionDescription,
    createConsequence,
    voteConsequence,
    setOptionActive,
    createSubItem,
    updateSubItem,
    setLikeToSubItem,
    setLike,
    setMessage,
    setSubAnswer,
    updateSubQuestionProcess,
    updateSubQuestionOrderBy,
    updateDoesUserHaveNavigation,
    setToFeedLastEntrance,
    setNotifications,
    setNumberOfMessagesMark,
    dontShowPopAgain,
    markUserSeenSuggestionsWizard,
    handleSubscription,
    sendError
};