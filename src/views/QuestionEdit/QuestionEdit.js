import m from "mithril";
import Sortable from "sortablejs";
import { get } from 'lodash';

import store from "../../data/store";
import { getQuestionDetails } from "../../functions/firebase/get/get";
import { updateQuestion } from '../../functions/firebase/set/setQuestion'
import { setSubQuestionsOrder } from "../../functions/firebase/set/set";
import { setWrapperHeight } from "../../functions/general";

import "./QuestionEdit.css";

import Header from "../Commons/Header/Header";


module.exports = {
  oninit: vnode => {
    //get user before login to page
    store.lastPage =
      "/questionEdit/" + vnode.attrs.groupId + "/" + vnode.attrs.questionId;
    sessionStorage.setItem("lastPage", store.lastPage);
    if (store.user.uid == undefined) {
      m.route.set("/login");
    }

    vnode.state = {
      title: "כותרת שאלה",
      description: "תאור שאלה",
      unsbscribe: {
        details: {},
        subQuestions: {}
      },
      editabels: {
        title: false,
        description: false
      },
      subQuestions: [],
      subQuestionsArray: [],
      addSubQuestin: false,
      newSubQuestion: "",
      authorized: {
        anonymous: false,
        public: false,
        registered: false
      }
    };

    vnode.state.unsbscribe.details = getQuestionDetails(
      vnode.attrs.groupId,
      vnode.attrs.questionId,
      vnode
    );

    // getSubQuestions(vnode.attrs.groupId, vnode.attrs.questionId, vnode);
  },
  oncreate: vnode => {
    setWrapperHeight("headerContainer", "questionEditWrapperAll");

    let sortOptions = document.getElementById("sortOptions");

    let sortOptionsObj = Sortable.create(sortOptions, {
      animation: 150,
      onEnd: evt => {
        //set order to DB
        let elements = evt.target.children;
        for (let i = 0; i < elements.length; i++) {
          setSubQuestionsOrder(
            vnode.attrs.groupId,
            vnode.attrs.questionId,
            elements[i].id,
            i
          );
        }
      }
    });
  },
  onbeforeupdate: vnode => {
    const { groupId } = vnode.attrs;
    let subQuestions = get(store.subQuestions, `[${groupId}]`, [])
    vnode.state.subQuestions = subQuestions.sort((a, b) => a.order - b.order)

  },
  onupdate: vnode => {
    setWrapperHeight("headerContainer", "questionEditWrapperAll");
  },
  onremove: vnode => {
    vnode.state.unsbscribe.details();
    // vnode.state.unsbscribe.subQuestions();
  },
  view: vnode => {
    return (
      <div>
        <Header
          title={vnode.state.title}
          topic="עריכת שאלה"
          description={vnode.state.description}
          upLevelUrl={`/question/${vnode.attrs.groupId}/${vnode.attrs.questionId
            }`}
        />
        <div class="wrapperAll" id="questionEditWrapperAll">
          <h2>מידע כללי</h2>
          <div class="questionIntro">
            {!vnode.state.editabels.title ? (
              <div
                class="questionIntroTitle"
                onclick={e => {
                  e.stopPropagation();
                  vnode.state.editabels.title = true;
                }}
              >
                <div class="subTitleEdit">כותרת:</div>
                <div> {vnode.state.title}</div>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={vnode.state.title}
                  class="questionIntroTitle"
                  onkeyup={e => {
                    updateField("title", e.target.value, vnode);
                  }}
                />
                <div
                  class="buttons questionIntroButton"
                  onclick={e => {
                    e.stopPropagation();
                    vnode.state.editabels.title = false;
                    updateQuestion(
                      vnode.attrs.groupId,
                      vnode.attrs.questionId,
                      vnode.state.title,
                      vnode.state.description,
                      vnode.state.authorized
                    );
                  }}
                >
                  שמירה
                </div>
              </div>
            )}
            {vnode.state.editabels.description ? (
              <div>
                <textarea
                  value={vnode.state.description}
                  class="questionIntroDescription_texterae"
                  onkeyup={e => {
                    updateField("description", e.target.value, vnode);
                  }}
                />
                <div
                  class="buttons questionIntroButton"
                  onclick={e => {
                    e.stopPropagation();
                    vnode.state.editabels.description = false;
                    updateQuestion(
                      vnode.attrs.groupId,
                      vnode.attrs.questionId,
                      vnode.state.title,
                      vnode.state.description
                    );
                  }}
                >
                  שמירה
                </div>
              </div>
            ) : (
              <div
                class="questionIntroDescription"
                onclick={e => {
                  e.stopPropagation();
                  vnode.state.editabels.description = true;
                }}
              >
                <div class="subTitleEdit">הסבר: </div>
                <div> {vnode.state.description}</div>
              </div>
            )}
          </div>
          {/* <div class="questionAuthorization checkBoxes">
            <h2>מי רשאי להשתתף</h2>
            <label>
              <input
                type="checkbox"
                name="checkbox"
                value="public"
                checked={vnode.state.authorized.public}
                onclick={e => {
                  setCheckboxValue(e, vnode);
                }}
              />
              כולם
            </label>
            <label>
              <input
                type="checkbox"
                name="checkbox"
                value="anonymous"
                checked={vnode.state.authorized.anonymous}
                onclick={e => {
                  setCheckboxValue(e, vnode);
                }}
              />
              אנונימיים
            </label>
            <label>
              <input
                type="checkbox"
                name="checkbox"
                value="registered"
                checked={vnode.state.authorized.registered}
                onclick={e => {
                  setCheckboxValue(e, vnode);
                }}
              />
              רשומים
            </label>
          </div> */}

          <h2>סדר הופעת השאלות</h2>
          <div id="sortOptions">
            {vnode.state.subQuestions.map((subQuestion, index) => {
              return (
                <p style={subQuestion.showSubQuestion == 'hidden' ? 'opacity:0.4' : 'opacity:1'} id={subQuestion.id}>{subQuestion.title}</p>
              );
            })}
          </div>
          {vnode.state.addSubQuestin ? (
            <div>
              <input
                type="text"
                placeholder="תת שאלה חדשה או תת מטרה חדשה"
                class="inputNewSubQuestion"
                value={vnode.state.newSubQuestion}
                onkeyup={e => {
                  vnode.state.newSubQuestion = e.target.value;
                }}
              />
            </div>
          ) : (
            <div />
          )
          }

        </div>
      </div>
    );
  }
};

function updateField(field, value, vnode) {
  vnode.state[field] = value;
}

function setCheckboxValue(e, vnode) {
  vnode.state.authorized[e.target.value] = e.target.checked;

  updateQuestion(
    vnode.attrs.groupId,
    vnode.attrs.questionId,
    vnode.state.title,
    vnode.state.description,
    vnode.state.authorized
  );
}
