import m from "mithril";
import "./NewGroupPage.css";

//model
import store from "../../../data/store";
import lang from '../../../data/languages';
//compnents
import Header from "../../Commons/Header/Header";
import Picture from '../../Commons/Picture/Picture';

const optionsArray = getLangOptions(lang);

//functions
import { createGroup } from "../../../functions/firebase/set/set";

module.exports = {
  oninit: vnode => {
    
    vnode.state = {
      title: false,
      description: "",
      callForAction: '',
      logo: false,
      language:'he'
    };
  },
  view: vnode => {
    return (
      <div>
        <Header topic="קבוצות" title="יצירת קבוצה חדשה" upLevelUrl="/groups" />
        <div class="wrapper wrapper_newGroup inputs">
          <select class="inputGeneral" onchange={(e)=>handleLanguageChange(e, vnode)}>
            {
            optionsArray.map(lng => {
              return (<option value={lng.key}>{lng.name}</option>)
            })

            }
          </select>
          <input
            class="inputGeneral"
            type="text"
            placeholder="שם הקבוצה"
            onkeyup={e => (vnode.state.title = e.target.value)}
          />
          <textarea
            class="inputGeneral"
            placeholder="תאור הקבוצה"
            onkeyup={e => (vnode.state.description = e.target.value)}
          />
          <textarea
            class="inputGeneral"
            placeholder="קריאה לפעולה - תופיעה בדף הכניסה לאפליקציה"
            onkeyup={e => (vnode.state.callForAction = e.target.value)}
          />
          <Picture logo={vnode.state.logo} id={vnode.attrs.id} />
          <input
            type="button"
            class="buttons"
            value="יצירת קבוצה חדשה"
            onclick={() => {
              if (vnode.state.title != false && vnode.state.title.length > 2) {

                const {uid, title, description, callForAction, language} = vnode.state;
                createGroup({creatorId:store.user.uid,title,description,callForAction,language} );
              }
            }}
          ></input>
        </div>
      </div>
    );
  }
};

function handleLanguageChange(e, vnode){
  
  vnode.state.language = e.target.value
}


function getLangOptions(langObj) {

  const optionsArray = []
  // get array of languages
  const languageKeys = Object.keys(langObj);
  languageKeys.map((languageKey, i) => {
    optionsArray[i] = { key: languageKey, name: langObj[languageKey].langName }
  })



  return optionsArray

}