import Editor from "@monaco-editor/react"
import React, { useEffect, useState } from "react"
import Typography from "@material-ui/core/Typography"
import parser, {
    parseRules,
    leftFactoring,
    removeLeftRecursion,
    input,
    rulesToInput,
} from "../compiler/parser"
import { Rule } from "../compiler/types"
import Button from "@material-ui/core/Button"
import Table from "@material-ui/core/Table"
import TableBody from "@material-ui/core/TableBody"
import TableCell from "@material-ui/core/TableCell"
import TableContainer from "@material-ui/core/TableContainer"
import TableHead from "@material-ui/core/TableHead"
import TableRow from "@material-ui/core/TableRow"
import Paper from "@material-ui/core/Paper"

interface FirstFollow {
    Nonterminal: string
    first: string
    follow: string
}

interface Select {
    id: number
    production: string
    set: string
}

type Predict = {
    [key: string]: {
        [key: string]: number
    }
}

export default function LL1() {
    const [grammar, setGrammar] = useState(`P -> P'
P' -> common commons
commons -> common commons
commons -> ε
common -> TYPE ID after_part
common -> STRUCT ID struct_body SEMI
struct_body -> LC struct_define struct_defines RC
struct_defines -> struct_define struct_defines
struct_defines -> ε
struct_define -> TYPE ID array_part SEMI
array_part -> LB const RB
after_part -> LP args RP func_body
after_part -> init vars SEMI
array_part -> ε
args -> TYPE ID arg
args -> ε
arg -> COMMA TYPE ID arg
arg -> ε
func_body -> SEMI
func_body -> block
block -> LC define_stmts stmts RC
define_stmts -> define_stmt define_stmts
define_stmts -> ε
define_stmt -> TYPE ID init vars SEMI
define_stmt -> STRUCT ID ID SEMI
init -> ASSIGNOP expression
init -> array_part
init -> ε
vars -> COMMA ID init vars
vars -> ε
stmts -> stmt stmts
stmts -> ε
stmt -> assign_stmt
stmt -> jump_stmt
stmt -> iteration_stmt
stmt -> if_stmt
stmt -> switch_stmt
assign_stmt -> expression SEMI
jump_stmt -> CONTINUE SEMI
jump_stmt -> BREAK SEMI
jump_stmt -> RETURN isnull_expr SEMI
iteration_stmt -> WHILE LP logical_expression RP block
iteration_stmt -> FOR LP isnull_expr SEMI isnull_expr SEMI isnull_expr RP block
iteration_stmt -> DO block WHILE LP logical_expression RP SEMI
if_stmt -> IF LP logical_expression RP block result
result -> ELSE after_else
result -> ε
after_else -> block
after_else -> if_stmt
switch_stmt -> SWITCH LP value RP LC case_stmt case_stmts default_stmt RC
case_stmts -> case_stmt case_stmts
case_stmts -> ε
case_stmt -> CASE const : stmts
default_stmt -> DEFAULT : stmts
default_stmt -> ε
logical_expression -> ! expression bool_expression
logical_expression -> expression bool_expression
bool_expression -> lop expression bool_expression
bool_expression -> ε
lop -> AND
lop -> OR
isnull_expr -> expression
isnull_expr -> ε
expression -> value operation
operation -> RELOP value
operation -> ASSIGNOP value
operation -> INCREMENT
operation -> DECREMENT
operation -> ε
value -> item value'
value' -> PLUS item value'
value' -> MINUS item value'
value' -> ε
item -> factor item'
item' -> STAR factor item'
item' -> DIV factor item'
item' -> MOD factor item'
item' -> ε
factor -> LP value RP
factor -> ID factor'
factor -> const
factor' -> array_part
factor' -> call_func
factor' -> DOT ID
factor' -> ε
call_func -> LP es RP
es -> expression eps
es -> ε
eps -> COMMA expression eps
eps -> ε
const -> INT
const -> FLOAT
const -> STRING`)
    const [rawRules, setRawRules] = useState<Array<Rule>>([])
    const [leftFactor, setLeftFactor] = useState<Array<Rule>>([])
    const [rules, setRules] = useState<Array<Rule>>([])
    const [predict, setPredict] = useState<any>({})
    const [firstFollow, setFirstFollow] = useState<Array<FirstFollow>>([])
    const [select, setSelect] = useState<Array<Select>>([])

    function handleClick() {
        const r1 = parseRules(grammar)
        const r2 = leftFactoring(r1)
        const r3 = removeLeftRecursion(r2)
        const {
            firstSets,
            followSets,
            selectSets,
            predictTable,
            NonTerminals,
        } = parser(r3)
        setRawRules(r1)
        setLeftFactor(r2)
        setRules(r3)

        let array1: Array<FirstFollow> = []
        for (const Nonterminal of NonTerminals) {
            array1.push({
                Nonterminal,
                first: firstSets.get(Nonterminal)!.join(" "),
                follow: followSets.get(Nonterminal)!.join(" "),
            })
        }
        setFirstFollow(array1)
        let array2: Array<Select> = []

        for (let i = 0; i < r3.length; i++) {
            array2.push({
                id: i,
                production: `${r3[i].left} -> ${r3[i].right.join(" ")}`,
                set: selectSets.get(i)!.join(" "),
            })
        }
        setSelect(array2)
        const temp: Predict = {}
        for (const Nonterminal of NonTerminals) {
            let obj: { [key: string]: number } = {}
            for (const [key, value] of predictTable.get(Nonterminal)!) {
                obj[key] = value
            }
            temp[Nonterminal] = obj
        }
        setPredict(temp)
    }

    return (
        <div className="App">
            <Typography variant="h5">Write your LL(1) grammar:</Typography>
            <Editor
                height="50vh"
                width="120vh"
                value={grammar}
                onChange={(value) => {
                    if (value) {
                        setGrammar(value)
                    }
                }}
                language="plaintext"
                options={{ fontSize: "16px" }}
            />
            <Button variant="contained" color="primary" onClick={handleClick}>
                submit
            </Button>

            <Typography variant="h5">提取左公因子 :</Typography>
            <Editor
                height="50vh"
                width="120vh"
                value={rulesToInput(leftFactor)}
                language="plaintext"
                options={{ fontSize: "16px" }}
            />
            <Typography variant="h5">消除左递归:</Typography>
            <Editor
                height="50vh"
                width="120vh"
                value={rulesToInput(rules)}
                language="plaintext"
                options={{ fontSize: "16px" }}
            />
            <TableContainer className="table" component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nonterminal</TableCell>
                            <TableCell align="left">FIRST集</TableCell>
                            <TableCell align="left"> FOLLOW集</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {firstFollow.map((set) => (
                            <TableRow key={set.Nonterminal}>
                                <TableCell component="th" scope="row">
                                    {set.Nonterminal}
                                </TableCell>
                                <TableCell align="left">{set.first}</TableCell>
                                <TableCell align="left">{set.follow}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TableContainer className="table" component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>id</TableCell>
                            <TableCell align="left">产生式</TableCell>
                            <TableCell align="left"> SELECT集</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {select.map((set) => (
                            <TableRow key={set.id}>
                                <TableCell component="th" scope="row">
                                    {set.id}
                                </TableCell>
                                <TableCell align="left">
                                    {set.production}
                                </TableCell>
                                <TableCell align="left">{set.set}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Typography variant="h5">Predict Table</Typography>
            <Editor
                height="80vh"
                width="120vh"
                value={
                    Object.keys(predict).length === 0
                        ? ""
                        : JSON.stringify(predict, null, 1)
                }
                language="json"
                options={{ fontSize: "16px" }}
            />
        </div>
    )
}
