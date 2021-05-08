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
    const [code, setCode] = useState(`int a = 0;
char array[12];
char 1a;        //语法错误
    
int test();
void test1(int a);
    
struct abc {
    int a;
    char b;
    long c;
};
    
int main() {
    int d = 0;
    struct abc d;
    array[0] = 'a';
    d.a = 10;
    for(a = 0; a < 10; a ++) {
        printf(a);
    }
    d = test();
    do {
        test1(d);
        d --;
    } while(d > 0);
    if(d == a) {
        printf(d);
    }
    return 0;
}
    
int b = 12;
    
int test() {
    int c = b+1;
    printf(b);
    return c;
}
    
struct abcd {
    int a;
    char b;
    long c[12];
};
    
void test1(int a) {
    struct abcd t;
    t.b = 'b';
    printf(a);
    return;
}`)
    const [tokens, setTokens] = useState<Array<Token>>([])
    const [ast, setAst] = useState<Node | null>(null)
    const [lexicalError, setLexicalError] = useState("")
    const [syntacticError, setSyntacticError] = useState("")
    const [tableVisibility, setTableVisibility] = useState<
        "hidden" | "visible"
    >("hidden")

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
            </main>
            <Editor
                height="85vh"
                width="100vh"
                value={ast ? printAST(ast).join("\n") : ""}
                // value={ast ? JSON.stringify(ast, null, 1) : ""}
                language="plaintext"
                options={{ fontSize: "18px" }}
            />
        </div>
    )
}

export default App
