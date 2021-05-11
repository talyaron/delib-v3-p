import m from 'mithril';
import { get } from 'lodash';
import './Sentence.css';

import { HEADER, PARAGRAPH } from './sentenceTypes';

//function
import { updateSentence } from '../../../../functions/firebase/set/setDocument';


module.exports = {
    oninit: vnode => {
        vnode.state = { isEdit: false }
    },
    view: vnode => {
        const { text, sentenceId, type } = vnode.attrs.sentence;
        const { order } = vnode.attrs;


        console.log('type:', type)

        return (
            <div class={`sentence ${ sentenceClass(type)}`} data-id={sentenceId} data-type='sentence'>
                <div class='documentCard__handle'>
                    <img src='img/sortHandle.svg' alt='sort sub question' />
                </div>
                <div class='sentence__main'>
                    {switchEdit()}
                </div>
            </div>
        )

        function switchEdit() {
            if (text && !vnode.state.isEdit) {
                return (<h2 onclick={() => { console.log('click'); vnode.state.isEdit = true }}>{text} {order}</h2>)
            }
            if (!text && !vnode.state.isEdit) {
                return (<p class='sentence__add' onclick={() => { vnode.state.isEdit = true }}>{'add'}</p>)
            }
            if (vnode.state.isEdit) {
                return (<input type='text' defaultValue={text} placeholder='enter text' onkeyup={e => handleInput(e, vnode)} />)
            }

            return (<input type='text' defaultValue={text} placeholder='enter text' onkeyup={e => handleInput(e, vnode)} />)
        }
    }
}



function handleInput(e, vnode) {
    const { groupId, questionId, order } = vnode.attrs;
    console.log('order:', order)
    const { sentenceId } = vnode.attrs.sentence;
    console.log(e.key)
    if (e.key === 'Enter') {
        updateSentence({ groupId, questionId, sentenceId, text: e.target.value, type: 'header', order });
        vnode.state.isEdit = false;
    }

}

function sentenceClass(type) {
   
    try {
        switch (type) {
            case HEADER:
                return 'sentence__header';
            case PARAGRAPH:
                return 'sentence__paragraph';
            default:
                return '';
        }
    } catch (e) {
        console.error(e)
    }
}
