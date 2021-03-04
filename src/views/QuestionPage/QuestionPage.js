import m from 'mithril';
import { get } from 'lodash';
import './QuestionPage.css';


//components

import Header from '../Commons/Header/Header';
import SubQuestionSolution from './SubQuestionsSolution/SubQuestionSolution';
import Spinner from '../Commons/Spinner/Spinner';
import Description from './Description/Description';
import AlertsSetting from '../Commons/AlertsSetting/AlertsSetting';
import NavBottom from '../Commons/NavBottom/NavBottom';
import NavTop from '../Commons/NavTop/NavTop';
import Chat from '../Commons/Chat/Chat';
import SubQuestionEditModal from './SubQuestionEditModal/SubQuestionEditModal';
import AddPanel from './AddPanel/AddPanel';
import VoteModal from './VoteModal/VoteModal';
import Reactions from '../Commons/Reactions/Reactions'

//model
import store from '../../data/store';
import lang from '../../data/languages';
//functions
import { getQuestionDetails, getSubQuestion, getLastTimeEntered, listenToChat, listenToGroup } from '../../functions/firebase/get/get';
import { registerGroup } from '../../functions/firebase/set/set';
import { deep_value, getIsChat, concatenateDBPath, getLanguage } from '../../functions/general';
import { cheackIfReactionExists } from '../../functions/firebase/get/getQuestions';
import { createReactions } from '../../functions/firebase/set/setQuestions';



module.exports = {
    oninit: vnode => {

        const { groupId, questionId } = vnode.attrs;

        let subQuestions = get(store.subQuestions, `[${groupId}]`, [])
        subQuestions = subQuestions.sort((a, b) => a.order - b.order);

        vnode.state = {
            title: deep_value(store.questions, `${groupId}.${questionId}.title`, 'כותרת השאלה'),
            addOption: false,
            callDB: true,
            subItems: {
                options: [],
                subQuestions,
                goals: [],
                values: []
            },
            subQuestions: [],
            add: {
                title: '',
                description: ''
            },
            orderBy: 'top',
            options: {},
            scrollY: false,
            subAnswers: {}, //used to set sub answers to each sub question
            subAnswersUnsb: {}, //used to unsubscribe
            modalSubQuestion: { isShow: false, new: true },
            showModal: {
                isShow: false,
                which: 'subQuestion'
            },
            openAddPanel: false,
            openVote: false,
            unsbscribe: {
                subQuestions: {},
                chat: () => { }
            },
            authorized: {
                anonymous: false,
                public: false,
                registered: false
            },
            isAlertsSetting: false,
            showModal: {
                isShow: true,
                which: 'subQuestion',
                subQuestionId: ''
            },
            subPage: getIsChat() ? 'chat' : 'main',
            unreadMessages: 0,
            lastTimeEntered: 0,
            language: 'he'
        }

        //get user before login to page
        store.lastPage = '/question/' + groupId + '/' + questionId;
        sessionStorage.setItem('lastPage', store.lastPage);

        //check to see if user logged in
        if (store.user.uid == undefined) {
            m.route.set('/login');
            vnode.state.callDB = false;
        } else {
            vnode.state.callDB = true;
        }

        //propare undubscribe function for question details to be used  onremove
        vnode.state.unsubscribeQuestionDetails = getQuestionDetails(groupId, questionId, vnode); //it will then listen to subQuestions
        vnode.state.unsbscribe.chat = listenToChat({ groupId, questionId });



        registerGroup(groupId);
        listenToGroup(groupId);

    },
    oncreate: vnode => {

        const { groupId, questionId } = vnode.attrs;
        getLastTimeEntered({ groupId, questionId }, vnode);
    },
    onbeforeupdate: vnode => {



        const { groupId, questionId } = vnode.attrs;

        vnode.state.title = deep_value(store.questions, `${groupId}.${questionId}.title`, 'כותרת השאלה');
        vnode.state.description = deep_value(store.questions, `${groupId}.${questionId}.description`, '');
        let subQuestions = get(store.subQuestions, `[${groupId}]`, [])

        vnode.state.subQuestions = subQuestions.sort((a, b) => a.order - b.order);
        let userRole = deep_value(store.questions, `${groupId}.${questionId}.roles.${store.user.uid}`, false);
        if (!userRole) {
            // the user is not a member in the question, he/she should login, and ask for
            // membership
        }

        //get number of unread massages
        if (vnode.state.subPage === 'chat') {
            vnode.state.lastTimeEntered = new Date().getTime() / 1000
        }
        const path = concatenateDBPath(groupId, questionId);
        vnode.state.unreadMessages = store.chat[path].filter(m => m.createdTime.seconds > vnode.state.lastTimeEntered).length;

        //get language
        vnode.state.language = getLanguage(groupId);

    },

    onremove: vnode => {

        const { groupId, questionId } = vnode.attrs;

        if (typeof vnode.state.unsbscribe.subQuestions === 'function') {
            vnode
                .state
                .unsbscribe
                .subQuestions();
        }

        vnode.state.unsbscribe.chat();



    },
    view: vnode => {

        const { language } = vnode.state;

        const { groupId, questionId } = vnode.attrs;

        return (
            <div class='page page__grid'>
                <AddPanel isOpen={vnode.state.openAddPanel} vsp={vnode.state} />

                <div class='page__header'>
                    <Header
                        topic='נושא'
                        title='נושא'
                        upLevelUrl={`/group/${vnode.attrs.groupId}`}
                        groupId={vnode.attrs.groupId}
                        showSubscribe={true}
                        questionId={vnode.attrs.questionId}
                    />
                    <NavTop level={'שאלות'}
                        current={vnode.state.subPage}
                        chat={lang[language].chat}
                        
                        pvs={vnode.state}
                        mainUrl={`/question/${groupId}/${questionId}`}
                        chatUrl={`/question-chat/${groupId}/${questionId}`}
                        ids={{ groupId, questionId }}
                        unreadMessages={vnode.state.unreadMessages} />


                </div>
                {vnode.state.subPage === 'main' ?
                    <div class='question__main'>
                        <Description
                            title={vnode.state.title}
                            content={vnode.state.description}
                            groupId={vnode.attrs.groupId}
                            questionId={vnode.attrs.questionId}
                            creatorId={vnode.state.creatorId}
                        />
                        <div class='wrapperSubQuestions' id='questionWrapperAll'>
                            <h1>שאלות </h1>
                            <div class='subQuestionsWrapper'>
                                <div class='question__reactions' onclick={() => handleOpenReactions(vnode)}>
                                    <h1>On line reactions</h1>
                                    <img src='img/reactions.svg'></img>
                                </div>
                                {vnode.state.subQuestions.map((subQuestion, index) => {

                                    return (<SubQuestionSolution
                                        key={subQuestion.id}
                                        creator={subQuestion.creator}
                                        groupId={vnode.attrs.groupId}
                                        questionId={vnode.attrs.questionId}
                                        subQuestionId={subQuestion.id}
                                        orderBy={subQuestion.orderBy}
                                        title={subQuestion.title}
                                        subItems={vnode.state.subItems.options}
                                        parentVnode={vnode}
                                        info={settings.subItems.options}
                                        processType={subQuestion.processType}
                                        userHaveNavigation={subQuestion.userHaveNavigation}
                                        proAgainstType={subQuestion.proAgainstType}
                                        showSubQuestion={subQuestion.showSubQuestion}
                                        numberOfSubquestions={vnode.state.subQuestions.length}
                                        isAlone={false}
                                        pvs={vnode.state}
                                    />)

                                })
                                }
                            </div>

                        </div>

                        {vnode.state.title === 'כותרת השאלה'
                            ? <Spinner />
                            : <div />
                        }

                    </div>
                    : null
                }
                {vnode.state.subPage === 'chat' ? <Chat
                    entity='question'
                    topic='שאלה'
                    ids={{ groupId: vnode.attrs.groupId, questionId: vnode.attrs.questionId }}
                    title={vnode.state.title}
                    description={vnode.state.description}
                    language={vnode.state.language}
                    url={m.route.get()}
                /> : null
                }
                {vnode.state.subPage === 'reactions' ?
                    <Reactions
                        groupId={groupId}
                        questionId={questionId}

                    /> : null
                }
                <div class='page__header'>
                    <NavBottom />
                </div>
                <AlertsSetting
                    isAlertsSetting={vnode.state.isAlertsSetting}
                    title={vnode.state.title}
                    alertsSetting={[{
                        title: 'הודעות חדשות',
                        ids: {
                            groupId: vnode.attrs.groupId,
                            questionId: vnode.attrs.questionId
                        },
                        isOn: true
                    }
                    ]} />
                < div
                    class={store.user.uid == vnode.state.creatorId ? "fav fav__subQuestion fav--blink" : "hidden"}
                    onclick={() => {
                        vnode.state.openAddPanel = true;
                        // vnode.state.modalSubQuestion = { isShow: true, new: true, numberOfSubquestions: vnode.state.subQuestions.length };
                    }}>
                    <div>
                        <div>+</div>
                    </div>

                </div >
                {vnode.state.openVote ? <VoteModal vsp={vnode.state} ids={{ groupId, questionId }} /> : null}
                {vnode.state.modalSubQuestion.isShow ?
                    <div class='background'>
                        <SubQuestionEditModal
                            subQuestion={vnode.state.modalSubQuestion}
                            pvs={vnode.state}
                            pva={vnode.attrs}
                        />
                    </div>
                    : null
                }

            </div>
        )
    }
}

function orderBy(order, vnode) {


    vnode
        .state
        .unsubscribeOptions();
    vnode.state.unsubscribeOptions = getSubQuestion('on', vnode.attrs.groupId, vnode.attrs.questionId, order);
    vnode.state.orderBy = order
}

async function handleOpenReactions(vnode) {
    try {

        const { groupId, questionId } = vnode.attrs;
        const { title } = vnode.state;
        if (!title) throw new Error('Title is missing');

        //check if reactions exists. if note create the reactions in DB.
        //then redirect to questions' reactions.

        let reactions = await cheackIfReactionExists({ groupId, questionId });
        if (reactions) {

            m.route.set(`/reactions/${groupId}/${questionId}`)
        } else {
            const isCreated = await createReactions({ groupId, questionId, title });

            if (isCreated) m.route.set(`/reactions/${groupId}/${questionId}`)
            else throw new Error(isCreated)
        }


    } catch (e) {
        console.error(e);
    }
}
