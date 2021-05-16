import React, { useState } from "react"
import "./App.css"
import Editor from "@monaco-editor/react"
import { Token, Node } from "./compiler/types"
import Header from "./components/Header"
import Table from "@material-ui/core/Table"
import TableBody from "@material-ui/core/TableBody"
import TableCell from "@material-ui/core/TableCell"
import TableContainer from "@material-ui/core/TableContainer"
import TableHead from "@material-ui/core/TableHead"
import TableRow from "@material-ui/core/TableRow"
import Paper from "@material-ui/core/Paper"
import { printAST } from "./compiler/parser"

function App() {
    const [code, setCode] = useState(`int x;
int y;
int z;
float c;
float d;
int x;          //变量重复声明
m = 3;          //变量未经声明就使用
char name[50][20][100];
struct Distance
{
    int feet;
    float inch;
};
        
do{
    if(c < d) {
        x = y + z;
    }else {
        x = y - z;
    }
}while(a<b);`)
    const [tokens, setTokens] = useState<Array<Token>>([])
    const [ast, setAst] = useState<Node | null>(null)
    const [lexicalError, setLexicalError] = useState("")
    const [syntacticError, setSyntacticError] = useState("")
    const [tableVisibility, setTableVisibility] =
        useState<"hidden" | "visible">("hidden")

    return (
        <>
            <Header
                code={code}
                setCode={setCode}
                setTokens={setTokens}
                setAst={setAst}
                setTableVisibility={setTableVisibility}
            />
            <div className="container">
                <div className="Editor">
                    <Editor
                        height="80vh"
                        width="100vh"
                        value={code}
                        onChange={(value) => {
                            if (value) {
                                setCode(value)
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
            </div>
            <div className="container">
                <Editor
                    height="85vh"
                    width="100vh"
                    value={ast ? printAST(ast).join("\n") : ""}
                    // value={ast ? JSON.stringify(ast, null, 1) : ""}
                    language="plaintext"
                    options={{ fontSize: "16px" }}
                />
                <Editor
                    height="85vh"
                    width="100vh"
                    value={ast ? JSON.stringify(ast, null, 1) : ""}
                    language="json"
                    options={{ fontSize: "16px" }}
                />
            </div>
        </>
    )
}

export default App
