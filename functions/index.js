const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
const settings = { timestampsInSnapshots: true };
db.settings(settings);

exports.totalVotes = functions.firestore
  .document(
    "groups/{groupId}/questions/{questionId}/subQuestions/{subQuestionId}/options/{optionId}/likes/{userId}"
  )
  .onUpdate((change, context) => {
    var newLike = change.after.data().like;
    var previousLike = 0;
    if (change.before.data() !== undefined) {
      previousLike = change.before.data().like;
    }

    var like = newLike - previousLike;

    var optionLikesRef = db
      .collection("groups")
      .doc(context.params.groupId)
      .collection("questions")
      .doc(context.params.questionId)
      .collection("subQuestions")
      .doc(context.params.subQuestionId)
      .collection("options")
      .doc(context.params.optionId);

    return db.runTransaction(transaction => {
      return transaction.get(optionLikesRef).then(optionDoc => {
        // Compute new number of ratings
        var totalVotes = 0;
        if (optionDoc.data().totalVotes !== undefined) {
          totalVotes = optionDoc.data().totalVotes + like;
        } else {
          totalVotes = newLike;
        }

        //calaculate consensus precentage:
        let consensusPrecentage = 1;
        if (optionDoc.data().totalVoters !== undefined) {
          let totalVoters = optionDoc.data().totalVoters;

          //old method
          // consensusPrecentage = totalVotes / totalVoters;

          //consensus with respect to group size
          consensusPrecentage = (totalVotes / totalVoters) * (Math.log(totalVoters) / Math.log(10));
        }

        // Compute new average rating
        // var oldRatingTotal = optionDoc.data('avgRating') * optionDoc.data('numRatings');
        // var newAvgRating = (oldRatingTotal + newLike) / newNumRatings;

        // Update restaurant info
        return transaction.update(optionLikesRef, {
          totalVotes,
          consensusPrecentage
        });
      });
    });
  });

exports.totalVoters = functions.firestore
  .document(
    "groups/{groupId}/questions/{questionId}/subQuestions/{subQuestionId}/options/{optionId}/likes/{userId}"
  )
  .onCreate((change, context) => {
    var newLike = change.data().like;

    var optionLikesRef = db
      .collection("groups")
      .doc(context.params.groupId)
      .collection("questions")
      .doc(context.params.questionId)
      .collection("subQuestions")
      .doc(context.params.subQuestionId)
      .collection("options")
      .doc(context.params.optionId);

    return db.runTransaction(transaction => {
      return transaction.get(optionLikesRef).then(optionDoc => {
        // Compute new number of ratings
        var totalVotes = newLike;
        if (optionDoc.data().totalVotes !== undefined) {
          totalVotes = optionDoc.data().totalVotes + newLike;
        }
        var totalVoters = 1;
        if (optionDoc.data().totalVoters !== undefined) {
          totalVoters = optionDoc.data().totalVoters + 1;
        }

        //calaculate consensus precentage:
        //simple consensus
        // let consensusPrecentage = totalVotes / totalVoters;

        //consensus with respect to group size
        let consensusPrecentage =
          (totalVotes / totalVoters) * (Math.log(totalVoters) / Math.log(10));

        // Update restaurant info
        return transaction.update(optionLikesRef, {
          totalVoters,
          totalVotes,
          consensusPrecentage
        });
      });
    });
  });

exports.totalLikesForSubQuestion = functions.firestore
  .document(
    "groups/{groupId}/questions/{questionId}/subQuestions/{subQuestionId}/likes/{userId}"
  )
  .onUpdate((change, context) => {
    var newLike = change.after.data().like;
    var previousLike = 0;
    if (change.before.data() !== undefined) {
      previousLike = change.before.data().like;
    }

    var like = newLike - previousLike;

    var subQuestionLikesRef = db
      .collection("groups")
      .doc(context.params.groupId)
      .collection("questions")
      .doc(context.params.questionId)
      .collection("subQuestions")
      .doc(context.params.subQuestionId);

    return db.runTransaction(transaction => {
      return transaction.get(subQuestionLikesRef).then(subQuestionDoc => {
        // Compute new number of ratings
        var totalVotes = 0;
        if (subQuestionDoc.data().totalVotes !== undefined) {
          totalVotes = subQuestionDoc.data().totalVotes + like;
        } else {
          totalVotes = like;
        }

        // Update restaurant info
        return transaction.update(subQuestionLikesRef, {
          totalVotes
        });
      });
    });
  });

// exports.totalLikesForQuestionsGoals = functions.firestore
//     .document('groups/{groupId}/questions/{questionId}/goals/{subGoalId}/likes/{userId}')
//     .onUpdate((change, context) => {
//         var newLike = change.after.data().like;
//         var previousLike = 0;
//         if (change.before.data() !== undefined) {
//             previousLike = change.before.data().like;
//         }

//         var like = newLike - previousLike;

//         var subGoalLikesRef = db.collection('groups').doc(context.params.groupId)
//             .collection('questions').doc(context.params.questionId)
//             .collection('goals').doc(context.params.subGoalId);

//         return db.runTransaction(transaction => {
//             return transaction.get(subGoalLikesRef).then(subGoalDoc => {
//                 // Compute new number of ratings
//                 var totalVotes = 0;
//                 if (subGoalDoc.data().totalVotes !== undefined) {
//                     totalVotes = subGoalDoc.data().totalVotes + like;
//                 } else {
//                     totalVotes = like;
//                 }

//                 // Update restaurant info
//                 return transaction.update(subGoalLikesRef, {
//                     totalVotes

//                 });
//             })
//         })
//     })

// exports.totalLikesForQuestionsValues = functions.firestore
//     .document('groups/{groupId}/questions/{questionId}/values/{subValueId}/likes/{userId}')
//     .onUpdate((change, context) => {
//         var newLike = change.after.data().like;
//         var previousLike = 0;
//         if (change.before.data() !== undefined) {
//             previousLike = change.before.data().like;
//         }

//         var like = newLike - previousLike;

//         var subValueLikesRef = db.collection('groups').doc(context.params.groupId)
//             .collection('questions').doc(context.params.questionId)
//             .collection('values').doc(context.params.subValueId);

//         return db.runTransaction(transaction => {
//             return transaction.get(subValueLikesRef).then(subGoalDoc => {
//                 // Compute new number of ratings
//                 var totalVotes = 0;
//                 if (subGoalDoc.data().totalVotes !== undefined) {
//                     totalVotes = subGoalDoc.data().totalVotes + like;
//                 } else {
//                     totalVotes = like;
//                 }

//                 // Update restaurant info
//                 return transaction.update(subValueLikesRef, {
//                     totalVotes

//                 });
//             })
//         })
//     })

exports.countNumbeOfMessages = functions.firestore
  .document(
    "groups/{groupId}/questions/{questionId}/subQuestions/{subQuestionId}/options/{optionId}/messages/{messageId}"
  )
  .onWrite((change, context) => {
    let docRef = db
      .collection("groups")
      .doc(context.params.groupId)
      .collection("questions")
      .doc(context.params.questionId)
      .collection("subQuestions")
      .doc(context.params.subQuestionId)
      .collection("options")
      .doc(context.params.optionId);

    if (!change.before.exists) {
      // New document Created : add one to count
      docRef
        .get()
        .then(snap => {
          //check if new
          let numberOfMessages = 0;
          if (isNaN(snap.data().numberOfMessages)) {
            numberOfMessages = 1;
          } else {
            numberOfMessages = snap.data().numberOfMessages + 1;
          }
          docRef.update({ numberOfMessages });
          return true;
        })
        .catch(err => {
          console.log(err);
        });
    } else if (change.before.exists && change.after.exists) {
      // Updating existing document : Do nothing
      return true;
    } else if (!change.after.exists) {
      // Deleting document : subtract one from count
      docRef
        .get()
        .then(snap => {
          docRef.update({ numberOfMessages: snap.data().numberOfMessages - 1 });
          return true;
        })
        .catch(err => {
          console.log(err);
        });
    }
  });
