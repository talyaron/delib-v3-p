import m from "mithril";
import { get } from 'lodash';

import "./Option.css";
import store from "../../../../../data/store";

import {
  setLike,
  updateOption,
  setOptionActive
} from "../../../../../functions/firebase/set/set";
import { getOptionVote } from "../../../../../functions/firebase/get/get";

module.exports = {
  oninit: (vnode) => {
    vnode.state = {
      creatorName: vnode.attrs.creatorName || "אנונימי",
      title: vnode.attrs.title,
      description: vnode.attrs.description,
      up: false,
      down: false,
      consensusPrecentage: "",
      isConNegative: false,
      posBefore: { top: 0, left: 0 },
      isAnimating: false,
      oldElement: {
        offsetTop: 0,
        offsetLeft: 0,
      },
      isAdmin: false,
      isEdit: false,
      isNamed: true,
      more: vnode.attrs.more || { text: "", URL: "" },
    };

    vnode.state.likeUnsubscribe = getOptionVote(
      vnode.attrs.groupId,
      vnode.attrs.questionId,
      vnode.attrs.subQuestionId,
      vnode.attrs.optionId,
      store.user.uid
    );

    store.optionsDetails[vnode.attrs.optionId] = {
      title: vnode.attrs.title,
      description: vnode.attrs.description,
    };
  },
  onbeforeupdate: (vnode) => {

    //get admin
    vnode.state.admin = get(store.groups, `[${vnode.attrs.groupId}].creatorId`, '')


    let optionVote = store.optionsVotes[vnode.attrs.optionId];

    //set conesnsus level to string
    if (vnode.attrs.consensusPrecentage !== undefined) {
      if (vnode.attrs.consensusPrecentage >= 0) {
        vnode.state.consensusPrecentage =
          Math.round(vnode.attrs.consensusPrecentage * 100) + "%";
        vnode.state.isConNegative = false;
      } else {
        vnode.state.consensusPrecentage =
          Math.abs(Math.round(vnode.attrs.consensusPrecentage * 100)) +
          "%" +
          " -";
        vnode.state.isConNegative = true;
      }
    }

    if (optionVote > 0) {
      vnode.state.up = true;
      vnode.state.down = false;
    } else if (optionVote < 0) {
      vnode.state.up = false;
      vnode.state.down = true;
    } else {
      vnode.state.up = false;
      vnode.state.down = false;
    }
  },
  onupdate: (vnode) => {

    //animation
    let element = vnode.dom;
    let elementY = element.offsetTop;
    let elementX = element.offsetLeft;
    let oldElement = { offsetTop: 0, offsetLeft: 0 };
    let toAnimate = false;

    if (store.optionsLoc.hasOwnProperty(vnode.attrs.optionId)) {
      oldElement = store.optionsLoc[vnode.attrs.optionId];
      toAnimate = store.optionsLoc[vnode.attrs.optionId].toAnimate;
    }

    let topMove = elementY - oldElement.offsetTop;
    let leftMove = elementX - oldElement.offsetLeft;

    if ((Math.abs(topMove) > 30 || Math.abs(leftMove) > 30) && toAnimate) {
      let elementDOM = document.getElementById(vnode.attrs.optionId);

      //animate
      store.optionsLoc[vnode.attrs.optionId] = {
        offsetTop: 0,
        offsetLeft: 0,
        toAnimate: false,
      };

      elementDOM
        .velocity(
          { top: -1 * topMove + "px", left: -1 * leftMove + "px" },
          {
            duration: 0,
            begin: (elms) => { },
          }
        )
        .velocity(
          { top: "0px", left: "0px" },
          {
            duration: 750,
            complete: (elms) => { },
          },
          "easeInOutCubic"
        );
    }
  },
  onremove: (vnode) => {
    vnode.state.likeUnsubscribe();
  },
  view: (vnode) => {
    const {groupId, questionId, subQuestionId, optionId} = vnode.attrs;
    return (
      <div
        class="optionCard"
        id={optionId}
        key={vnode.attrs.key}
      >
        <div class="optionCard__main">
          <div
            class={vnode.state.up ? "optionCard__vote optionSelcetUp" : "optionCard__vote"}
            onclick={() => {
              setSelection("up", vnode);
            }}
          >
            <img
              class={vnode.state.up ? "voteUp" : ""}
              src={vnode.state.up ?"img/voteUpWhite.svg":"img/voteUp.svg"}
            />
          </div>
          <div class="optionContent">
            <div class="cardTitle">
              {!vnode.state.isEdit ? (
                <span>{vnode.attrs.title}</span>
              ) : (
                  <input
                    type="text"
                    value={vnode.state.title}
                    onkeyup={(e) => {
                      vnode.state.title = e.target.value;
                    }}
                  />
                )}
            </div>
            {!vnode.state.isEdit ? (
              <div class="optionCard__creator">
                 {vnode.state.creatorName}
              </div>
            ) : (
                <div class="optionCard__creator">
                  <input
                    type="checkbox"
                    defaultChecked={vnode.state.isNamed}
                    onchange={(e) => {
                      isAnonymous(e, vnode);
                    }}
                  />
                  {vnode.state.isNamed ? (
                    <span>{vnode.state.creatorName}</span>
                  ) : (
                      <span>אנונימי/ת</span>
                    )}
                </div>
              )}

            <div class="option__card__description" onclick={()=>{if(!vnode.state.isEdit){m.route.set(`/option/${groupId}/${questionId}/${subQuestionId}/${optionId}`)}}}>
              {!vnode.state.isEdit ? (
                <span>{vnode.attrs.description}</span>
              ) : (
                  <textarea
                    value={vnode.state.description}
                    onkeyup={(e) => {
                      vnode.state.description = e.target.value;
                    }}
                  />
                )}
            </div>
            {vnode.state.more.text.length > 0 ? (
              <div>
                {!vnode.state.isEdit ? (
                  <a
                    class="cardMore"
                    href={vnode.state.more.URL}
                    target="_blank"
                  >
                    {vnode.state.more.text}
                  </a>
                ) : (
                    <div class="cardTitle">
                      <input
                        placeholder="טקסט"
                        type="text"
                        oninput={(e) => {
                          vnode.state.more.text = e.target.value;
                        }}
                        value={vnode.state.more.text}
                      ></input>
                      <input
                        type="url"
                        placeholder="URL"
                        oninput={(e) => {
                          vnode.state.more.URL = e.target.value;
                        }}
                        value={vnode.state.more.URL}
                      ></input>
                    </div>
                  )}
              </div>
            ) : (
                <div>
                  {!vnode.state.isEdit ? (
                    <div />
                  ) : (
                      <div class="cardTitle">
                        <input
                          type="text"
                          oninput={(e) => {
                            vnode.state.more.text = e.target.value;
                          }}
                          placeholder="טקסט"
                          value={vnode.state.more.text}
                        ></input>
                        <input
                          type="url"
                          oninput={(e) => {
                            vnode.state.more.URL = e.target.value;
                          }}
                          placeholder="URL"
                          value={vnode.state.more.URL}
                        ></input>
                      </div>
                    )}
                </div>
              )}
          </div>
          <div
            class={
              vnode.state.down ? "optionCard__vote optionSelcetDown" : "optionCard__vote"
            }
            onclick={() => {
              setSelection("down", vnode);
            }}
          >
            <img
              class={vnode.state.down ? "voteDown" : ""}
              src={vnode.state.down ?"img/voteDownWhite.svg":"img/voteDown.svg"}
            />
          </div>
        </div>
        {/* options information panel */}
        <hr></hr>
        <div class="optionCard__info">
          <div class="optionCard__infoItem">
            <img src="img/group2.svg" />
            {vnode.attrs.totalVoters}
          </div>
          <div
            class={
              vnode.state.isConNegative ? "optionCard__infoItem negative" : "optionCard__infoItem"
            }
          >
            <img src="img/voteUpDown.svg" />
            {vnode.state.consensusPrecentage}
          </div>
          <div
            class="optionCard__infoItem"
            onclick={() => { m.route.set(`/option-chat/${groupId}/${questionId}/${subQuestionId}/${optionId}`)}}
          >
            <img src="img/chat.svg" />
            {!isNaN(vnode.attrs.messagesCounter)
              ? vnode.attrs.messagesCounter
              : 0}
          </div>
          <div
            class="optionCard__infoItem"
            onclick={() => {
              vnode.state.isEdit = !vnode.state.isEdit;
            }}
          >
            {vnode.attrs.creatorId == store.user.uid ? (
              <div>
                {!vnode.state.isEdit ? (
                  <img src="img/edit.svg" />
                ) : (
                    <div
                      class="buttons editOptionBtn"
                      onclick={() => {
                        updateOption(vnode);
                      }}
                    >
                      אישור
                    </div>
                  )}
              </div>
            ) : (
                <div />
              )}
          </div>
          {vnode.attrs.creatorId == store.user.uid || vnode.state.admin == store.user.uid ?
            <div class="optionCard__infoItem" onclick={() => handleHide(vnode)}>
              <img src="img/visibility_off-24px.svg" />
            </div>
            : null
          }
        </div>
      </div>
    );
  },
};

function setSelection(upDown, vnode) {
  if (upDown == "up") {
    vnode.state.up = !vnode.state.up;
    vnode.state.down = false;

    if (vnode.state.up) {
      setLike(
        vnode.attrs.groupId,
        vnode.attrs.questionId,
        vnode.attrs.subQuestionId,
        vnode.attrs.optionId,
        store.user.uid,
        1
      );
    } else {
      setLike(
        vnode.attrs.groupId,
        vnode.attrs.questionId,
        vnode.attrs.subQuestionId,
        vnode.attrs.optionId,
        store.user.uid,
        0
      );
    }
  } else {
    vnode.state.down = !vnode.state.down;
    vnode.state.up = false;
    if (vnode.state.down) {
      setLike(
        vnode.attrs.groupId,
        vnode.attrs.questionId,
        vnode.attrs.subQuestionId,
        vnode.attrs.optionId,
        store.user.uid,
        -1
      );
    } else {
      setLike(
        vnode.attrs.groupId,
        vnode.attrs.questionId,
        vnode.attrs.subQuestionId,
        vnode.attrs.optionId,
        store.user.uid,
        0
      );
    }
  }
}

function isAnonymous(e, vnode) {
  vnode.state.isNamed = e.target.checked;
}

function handleHide(vnode) {
  try {
    let isDeactivate = confirm("האם אתם בטוחים שיש להחביא אופציה זאת?");

    if (isDeactivate) {
      setOptionActive(vnode.attrs.groupId, vnode.attrs.questionId, vnode.attrs.subQuestionId, vnode.attrs.optionId, false)
    }
  }
  catch (err) {
    console.error(err)
  }
}