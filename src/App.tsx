import React, { useState } from "react";
import "./App.css";
import Editor from "@monaco-editor/react";
import Typography from "@material-ui/core/Typography";
import { Token, Node } from "./compiler/types";
import Header from "./components/Header";

function App() {
    const [code, setCode] = useState(`for(int i=0;i<10;i++) {
    print("hello"); 
    i = ~3;
}`);
    const [tokens, setTokens] = useState<Array<Token>>([]);
    const [ast, setAst] = useState<Node | null>(null);
    const [lexicalError, setLexicalError] = useState("");
    const [syntacticError, setSyntacticError] = useState("");

    return (
        <div className="App">
            <Header
                code={code}
                setCode={setCode}
                setTokens={setTokens}
                setAst={setAst}
            />
            <main>
                <div className="Editor">
                    <Editor
                        height="85vh"
                        width="100vh"
                        value={code}
                        onChange={(value) => {
                            if (value) {
                                setCode(value);
                            }
                        }}
                        language="c"
                        options={{ fontSize: "18px" }}
                    />
                </div>
                <div className="Result">
                    {tokens.map((token) => (
                        <Typography variant="h6" key={token.id}>
                            {`${token.input} ${token.name}   ${token.value}  `}
                        </Typography>
                    ))}
                </div>
            </main>
            <Editor
                height="85vh"
                width="100vh"
                value={ast ? JSON.stringify(ast, null, 1) : ""}
                language="plaintext"
                options={{ fontSize: "18px" }}
            />
        </div>
    );
}

export default App;
