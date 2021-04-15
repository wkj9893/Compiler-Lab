import React, { useState } from "react";
import "./App.css";
import Editor from "@monaco-editor/react";
import Typography from "@material-ui/core/Typography";
import { Token, Node } from "./compiler/types";
import Header from "./components/Header";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";

function App() {
    const [code, setCode] = useState(`for(int i=0;i<10;i++) {
    print("hello"); 
    i = ~3;
}`);
    const [tokens, setTokens] = useState<Array<Token>>([]);
    const [ast, setAst] = useState<Node | null>(null);
    const [lexicalError, setLexicalError] = useState("");
    const [syntacticError, setSyntacticError] = useState("");
    const [tableVisibility, setTableVisibility] = useState<
        "hidden" | "visible"
    >("hidden");

    return (
        <div className="App">
            <Header
                code={code}
                setCode={setCode}
                setTokens={setTokens}
                setAst={setAst}
                setTableVisibility={setTableVisibility}
            />
            <main>
                <div className="Editor">
                    <Editor
                        height="80vh"
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
                <TableContainer
                    className="table"
                    component={Paper}
                    style={{
                        visibility: tokens.length > 0 ? "visible" : "hidden",
                    }}
                >
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>LEXEMES</TableCell>
                                <TableCell align="left">TOKEN NAME</TableCell>
                                <TableCell align="left">
                                    ATTRIBUTE VALUE
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tokens.map((token) => (
                                <TableRow key={token.id}>
                                    <TableCell component="th" scope="row">
                                        {token.input}
                                    </TableCell>
                                    <TableCell align="left">
                                        {token.name}
                                    </TableCell>
                                    <TableCell align="left">
                                        {token.value}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
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
