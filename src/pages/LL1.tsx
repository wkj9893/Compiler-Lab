import Editor from "@monaco-editor/react";
import React, { useEffect, useState } from "react";
import Typography from "@material-ui/core/Typography";
import parser, {
    parseRules,
    leftFactoring,
    removeLeftRecursion,
    input,
    rulesToInput,
} from "../compiler/parser";
import { Rule } from "../compiler/types";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";

interface FirstFollow {
    Nonterminal: string;
    first: string;
    follow: string;
}

interface Select {
    id: number;
    production: string;
    set: string;
}

type Predict = {
    [key: string]: {
        [key: string]: number;
    };
};

export default function LL1() {
    const [grammar, setGrammar] = useState(input);
    const [rawRules, setRawRules] = useState<Array<Rule>>([]);
    const [leftFactor, setLeftFactor] = useState<Array<Rule>>([]);
    const [rules, setRules] = useState<Array<Rule>>([]);
    const [predict, setPredict] = useState<any>({});
    const [firstFollow, setFirstFollow] = useState<Array<FirstFollow>>([]);
    const [select, setSelect] = useState<Array<Select>>([]);

    function handleClick() {
        const r1 = parseRules(grammar);
        const r2 = leftFactoring(r1);
        const r3 = removeLeftRecursion(r2);
        const {
            firstSets,
            followSets,
            selectSets,
            predictTable,
            NonTerminals,
        } = parser(r3);
        setRawRules(r1);
        setLeftFactor(r2);
        setRules(r3);

        let array1: Array<FirstFollow> = [];
        for (const Nonterminal of NonTerminals) {
            array1.push({
                Nonterminal,
                first: firstSets.get(Nonterminal)!.join(" "),
                follow: followSets.get(Nonterminal)!.join(" "),
            });
        }
        setFirstFollow(array1);
        let array2: Array<Select> = [];

        for (let i = 0; i < r3.length; i++) {
            array2.push({
                id: i,
                production: `${r3[i].left} -> ${r3[i].right.join(" ")}`,
                set: selectSets.get(i)!.join(" "),
            });
        }
        setSelect(array2);
        const temp: Predict = {};
        for (const Nonterminal of NonTerminals) {
            let obj: { [key: string]: number } = {};
            for (const [key, value] of predictTable.get(Nonterminal)!) {
                obj[key] = value;
            }
            temp[Nonterminal] = obj;
        }
        setPredict(temp);
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
                        setGrammar(value);
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
    );
}
