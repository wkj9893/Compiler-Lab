import { Token, Rule, Node } from "./types";

export const input = `P -> P'
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
const -> STRING`;

export const rules = removeLeftRecursion(leftFactoring(parseRules(input)));

/**
 * parse rules to raw input
 * @param rules rules
 */
export function rulesToInput(rules: Array<Rule>): string {
    let input = "";
    rules.forEach((rule) => {
        input += rule.left;
        input += " -> ";
        input += rule.right.join(" ");
        input += "\n";
    });
    return input;
}

/**
 * parse input to rules
 * @param input raw input
 */
export function parseRules(input: string): Array<Rule> {
    const input_array = input.split("\n");
    let rules = [];
    for (const i of input_array) {
        const temp = i.split("->");
        if (temp[0] && temp[1]) {
            const left = temp[0].trim();
            const right = temp[1].trim().split(/\s+/);

            rules.push({
                left,
                right,
            });
        }
    }
    return rules;
}
/**
 * Left factoring a grammar
 * @param rules Grammar G
 * @returns An equivalent left-factored grammar.
 */
export function leftFactoring(rules: Array<Rule>): Array<Rule> {
    while (true) {
        let isSetChanged = false;
        for (let i = 0; i < rules.length; i++) {
            let array = [i];
            for (let j = i + 1; j < rules.length; j++) {
                if (
                    rules[i].left === rules[j].left &&
                    rules[i].right[0] === rules[j].right[0]
                ) {
                    isSetChanged = true;
                    array.push(j);
                }
            }
            if (array.length > 1) {
                let newRules: Array<Rule> = [];
                for (const k of array) {
                    newRules.push({
                        left: `${rules[i].left}${rules[i].right[0]}`,
                        right:
                            rules[k].right.length > 1
                                ? rules[k].right.slice(1)
                                : ["ε"],
                    });
                }
                const temp = {
                    left: rules[i].left,
                    right: [
                        rules[i].right[0],
                        `${rules[i].left}${rules[i].right[0]}`,
                    ],
                };
                rules = rules.filter((value, index) => !array.includes(index));
                return [
                    ...leftFactoring(rules),
                    temp,
                    ...leftFactoring(newRules),
                ];
            }
        }
        if (!isSetChanged) {
            break;
        }
    }
    return rules;
}
/**
 * convert the Left Recursion to Right Recursion in order to eliminate Left Recursion
 * @param rules rules to be converted
 * @returns An equivalent converted rules
 */
export function removeLeftRecursion(rules: Array<Rule>) {
    let newRules: Array<Rule> = [];
    let set = new Set();

    for (const { left, right } of rules) {
        if (left === right[0] && !set.has(left)) {
            set.add(left);
            const left_string = left;
            for (const { left, right } of rules) {
                if (left === left_string) {
                    //  A -> A a
                    if (right[0] === left) {
                        newRules.push({
                            left: `_${left}`,
                            right: [...right.slice(1), `_${left}`],
                        });
                    } //  A -> B
                    else {
                        newRules.push({
                            left: left,
                            right: [...right, `_${left}`],
                        });
                    }
                }
            }
            newRules.push({ left: `_${left}`, right: ["ε"] });
        }
    }
    let temp = [];
    for (const { left, right } of rules) {
        if (!set.has(left)) {
            temp.push({ left, right });
        }
    }
    newRules = [...temp, ...newRules];
    return newRules;
}

export default function parser(rules: Array<Rule>) {
    /**
     * compute firstSets and followSets and predictSets based on rules
     * @param rules
     * @returns firstSets and followSets and predictSets
     */
    let NonTerminals: Set<string> = new Set();
    let firstSets: Map<string, Array<string>> = new Map();
    let followSets: Map<string, Array<string>> = new Map();
    let selectSets: Map<number, Array<string>> = new Map();
    let predictTable: Map<string, Map<string, number>> = new Map();

    rules.forEach(({ left }, index) => {
        NonTerminals.add(left);
        selectSets.set(index, []);
        predictTable.set(left, new Map());
    });

    NonTerminals.forEach((NonTerminal) => {
        firstSets.set(NonTerminal, []);
        followSets.set(NonTerminal, []);
    });

    function union(arr1: string[], arr2: string[]) {
        return [...new Set([...arr1, ...arr2])];
    }

    function isNonterminal(item: string) {
        return NonTerminals.has(item);
    }

    function getFristSet(set: string[], right: string[]): string[] {
        if (right.length === 1) {
            if (!isNonterminal(right[0])) {
                return union(set, [right[0]]);
            } else {
                return union(set, firstSets.get(right[0])!);
            }
        } else if (right.length >= 1) {
            if (!isNonterminal(right[0])) {
                return union(set, [right[0]]);
            } else {
                if (!firstSets.get(right[0])!.includes("ε")) {
                    return union(set, firstSets.get(right[0])!);
                } else {
                    const temp = firstSets
                        .get(right[0])!
                        .filter((v: string) => v != "ε");
                    set = union(set, temp);
                    return getFristSet(set, right.slice(1));
                }
            }
        } else {
            return set;
        }
    }

    function getFristSets(): Map<string, Array<string>> {
        while (true) {
            let isSetChanged = false;
            for (const { left, right } of rules) {
                const a = firstSets.get(left);
                const set = getFristSet(firstSets.get(left)!, right);

                if (firstSets.get(left)!.length !== set.length) {
                    firstSets.set(left, set);
                    isSetChanged = true;
                }
            }
            if (!isSetChanged) {
                break;
            }
        }
        return firstSets;
    }
    function getFollowSet(left: string, right: string[]): string[] {
        if (right.length === 1) {
            return followSets.get(left)!;
        } else {
            if (isNonterminal(right[1])) {
                let set: Array<string> = firstSets
                    .get(right[1])!
                    .filter((item: string) => item != "ε");
                if (firstSets.get(right[1])!.includes("ε")) {
                    set = union(
                        set,
                        getFollowSet(left, [right[0], ...right.slice(2)])
                    );
                }
                return set;
            } else {
                return [right[1]];
            }
        }
    }

    function getFollowSets(): Map<string, Array<string>> {
        followSets.set(rules[0].left, ["$"]);
        while (true) {
            let isSetChanged = false;
            for (const { left, right } of rules) {
                for (const [index, value] of right.entries()) {
                    if (!isNonterminal(value)) {
                        continue;
                    }
                    const set = union(
                        followSets.get(value)!,
                        getFollowSet(left, right.slice(index))
                    );
                    if (followSets.get(value)!.length !== set.length) {
                        followSets.set(value, set);
                        isSetChanged = true;
                    }
                }
            }
            if (!isSetChanged) {
                break;
            }
        }
        return followSets;
    }

    function getSelectSet(left: string, right: string[]): string[] {
        if (!isNonterminal(right[0])) {
            if (right[0] === "ε") {
                return followSets.get(left)!;
            }
            return [right[0]];
        }
        let set = firstSets
            .get(right[0])!
            .filter((item: string) => item != "ε");
        if (right.length === 1) {
            return set;
        } else {
            if (firstSets.get(right[0])!.includes("ε")) {
                set = union(set, getSelectSet(left, right.slice(1)));
            }
        }
        return set;
    }
    function getSelectSets(): Map<number, Array<string>> {
        let index = 0;
        for (const { left, right } of rules) {
            selectSets.set(index, getSelectSet(left, right));
            index++;
        }
        return selectSets;
    }

    function getPredictTable() {
        for (let i = 0; i < rules.length; i++) {
            for (let j = 0; j < selectSets.get(i)!.length; j++) {
                const key = selectSets.get(i)![j];
                if (!predictTable.get(rules[i].left)?.get(key)) {
                    predictTable.get(rules[i].left)?.set(key, i);
                } else {
                    console.log(
                        key,
                        predictTable.get(rules[i].left)?.get(key),
                        i,
                        "出现冲突"
                    );
                }
            }
        }
        return predictTable;
    }
    function predict(tokens: Array<Token>): Node {
        let AST: Node = { type: rules[0].left };
        let AST_current = 0;
        tokens.push({
            id: tokens.length,
            input: "$",
            name: "$",
            value: "$",
        });
        let stack = ["$", rules[0].left];
        let current = 0;
        while (stack.length > 1 && current < tokens.length) {
            if (isNonterminal(stack[stack.length - 1])) {
                const index = predictTable
                    .get(stack[stack.length - 1])
                    ?.get(tokens[current].name);
                if (index !== undefined) {
                    console.log(
                        `${rules[index].right}替换${stack[stack.length - 1]}`
                    );
                    rules[index].right.forEach((value) => {
                        pushNode(
                            AST,
                            stack[stack.length - 1],
                            value,
                            AST_current
                        );
                    });
                    stack.pop();
                    if (rules[index].right[0] !== "ε") {
                        const temp = [...rules[index].right].reverse();
                        stack.push(...temp);
                    }
                } else {
                    console.log(
                        `匹配不成功,${stack[stack.length - 1]},${
                            (tokens[current].name, tokens[current].id)
                        }`
                    );
                    break;
                }
            } else {
                if (stack[stack.length - 1] === tokens[current].name) {
                    console.log(`弹出${stack[stack.length - 1]}`);
                    stack.pop();
                    current++;
                } else {
                    console.log("匹配不成功", tokens[current]);
                    break;
                }
            }
        }
        if (current === tokens.length - 1) {
            console.log("匹配完成");
        }
        return AST;

        //  dfs search
        function pushNode(
            AST: Node,
            target: string,
            value: string,
            current: number
        ) {
            if (current !== AST_current) {
                return;
            }
            if (AST.type === target) {
                if (AST.children) {
                    AST.children.push({ type: value });
                } else {
                    AST.children = [{ type: value }];
                }
                AST_current++;
                return;
            } else {
                if (AST.children) {
                    AST.children.forEach((child) => {
                        pushNode(child, target, value, current);
                    });
                }
            }
        }
    }

    firstSets = getFristSets();
    followSets = getFollowSets();
    selectSets = getSelectSets();
    predictTable = getPredictTable();
    return {
        firstSets,
        followSets,
        selectSets,
        predictTable,
        predict,
        NonTerminals,
    };
}
