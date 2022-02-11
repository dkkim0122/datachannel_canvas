import * as Y from "yjs";
// @ts-ignore
import { yCollab, yUndoManagerKeymap } from "y-codemirror.next";
// import { WebsocketProvider } from 'y-websocket'
import { WebrtcProvider } from "y-webrtc";

import { EditorState, EditorView, basicSetup } from "@codemirror/basic-setup";
import { keymap } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import React, { useEffect } from "react";
import * as random from "lib0/random";

export const usercolors = [
  { color: "#30bced", light: "#30bced33" },
  { color: "#6eeb83", light: "#6eeb8333" },
  { color: "#ffbc42", light: "#ffbc4233" },
  { color: "#ecd444", light: "#ecd44433" },
  { color: "#ee6352", light: "#ee635233" },
  { color: "#9ac2c9", light: "#9ac2c933" },
  { color: "#8acb88", light: "#8acb8833" },
  { color: "#1be7ff", light: "#1be7ff33" },
];

export const userColor = usercolors[random.uint32() % usercolors.length];

const CodeEditor = () => {
  useEffect(() => {
    const ydoc = new Y.Doc();
    // const provider = new WebrtcProvider('codemirror6-demo-room', ydoc)
    const provider = new WebrtcProvider("webrtc-test", ydoc, {
      signaling: ["wss://signaling.yjs.dev"],
    });
    // const provider = new WebsocketProvider(
    //   'wss://demos.yjs.dev',
    //   'codemirror.next-demo',
    //   ydoc
    // )
    const ytext = ydoc.getText("codemirror");

    provider.awareness.setLocalStateField("user", {
      name: "Anonymous " + Math.floor(Math.random() * 100),
      color: userColor.color,
      colorLight: userColor.light,
    });

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        keymap.of([...yUndoManagerKeymap]),
        basicSetup,
        javascript(),
        yCollab(ytext, provider.awareness),
        // oneDark
      ],
    });

    const view = new EditorView({
      state,
      parent: /** @type {HTMLElement} */ (document.querySelector("#editor")),
    });
  });
  return <div id="editor" />;
};

export default CodeEditor;
