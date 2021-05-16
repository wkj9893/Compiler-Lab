import { Token, Rule, Node } from "./types"

// Expression -> Expression' Expression
export const input = `Program -> ε
Program -> VariableDeclaration SEMI Program
Program -> StructDeclaration SEMI Program
Program -> Assignment SEMI Program
Program -> IfStatement Program
Program -> WhileStatement Program
Program -> DoWhileStatement SEMI Program

StructDeclaration -> STRUCT ID LC StructBody RC
StructBody -> TYPE ID SEMI StructBody
StructBody -> ε

VariableDeclaration -> TYPE ID Init
VariableDeclaration -> ID Init
Init -> ASSIGNOP Expression
Init -> ε
Init -> LB INT RB Init


Expression -> Expression AND Expression
Expression -> Expression OR Expression
Expression -> Expression RELOP Expression
Expression -> Expression PLUS Expression
Expression -> Expression MINUS Expression
Expression -> Expression STAR Expression
Expression -> Expression DIV Expression
Expression -> INT
Expression -> FLOAT

IfStatement -> IF LP Expression RP LC Program RC ELSE LC Program RC
WhileStatement -> WHILE LP Expression RP ExpressionStatement
DoWhileStatement -> DO LC Program RC WHILE LP Expression RP
`

export const rules = parseRules(input)

/**
 * parse rules to raw input
 * @param rules rules
 */
export function rulesToInput(rules: Array<Rule>): string {
    let input = ""
    rules.forEach((rule) => {
        input += rule.left
        input += " -> "
        input += rule.right.join(" ")
        input += "\n"
    })
    return input
}

/**
 * parse input to rules
 * @param input raw input
 */
export function parseRules(input: string): Array<Rule> {
    const input_array = input.split("\n")
    let rules = []
    for (const i of input_array) {
        const temp = i.split("->")
        if (temp[0] && temp[1]) {
            const left = temp[0].trim()
            const right = temp[1].trim().split(/\s+/)

            rules.push({
                left,
                right,
            })
        }
    }
    return rules
}
/**
 * Left factoring a grammar
 * @param rules Grammar G
 * @returns An equivalent left-factored grammar.
 */
export function leftFactoring(rules: Array<Rule>): Array<Rule> {
    while (true) {
        let isSetChanged = false
        for (let i = 0; i < rules.length; i++) {
            let array = [i]
            for (let j = i + 1; j < rules.length; j++) {
                if (
                    rules[i].left === rules[j].left &&
                    rules[i].right[0] === rules[j].right[0]
                ) {
                    isSetChanged = true
                    array.push(j)
                }
            }
            if (array.length > 1) {
                let newRules: Array<Rule> = []
                for (const k of array) {
                    newRules.push({
                        left: `${rules[i].left}${rules[i].right[0]}`,
                        right:
                            rules[k].right.length > 1
                                ? rules[k].right.slice(1)
                                : ["ε"],
                    })
                }
                const temp = {
                    left: rules[i].left,
                    right: [
                        rules[i].right[0],
                        `${rules[i].left}${rules[i].right[0]}`,
                    ],
                }
                rules = rules.filter((value, index) => !array.includes(index))
                return [
                    ...leftFactoring(rules),
                    temp,
                    ...leftFactoring(newRules),
                ]
            }
        }
        if (!isSetChanged) {
            break
        }
    }
    return rules
}
/**
 * convert the Left Recursion to Right Recursion in order to eliminate Left Recursion
 * @param rules rules to be converted
 * @returns An equivalent converted rules
 */
export function removeLeftRecursion(rules: Array<Rule>) {
    let newRules: Array<Rule> = []
    let set = new Set()

    for (const { left, right } of rules) {
        if (left === right[0] && !set.has(left)) {
            set.add(left)
            const left_string = left
            for (const { left, right } of rules) {
                if (left === left_string) {
                    //  A -> A a
                    if (right[0] === left) {
                        newRules.push({
                            left: `_${left}`,
                            right: [...right.slice(1), `_${left}`],
                        })
                    } //  A -> B
                    else {
                        newRules.push({
                            left: left,
                            right: [...right, `_${left}`],
                        })
                    }
                }
            }
            newRules.push({ left: `_${left}`, right: ["ε"] })
        }
    }
    let temp = []
    for (const { left, right } of rules) {
        if (!set.has(left)) {
            temp.push({ left, right })
        }
    }
    newRules = [...temp, ...newRules]
    return newRules
}

export default function parser(rules: Array<Rule>) {
    /**
     * compute firstSets and followSets and predictSets based on rules
     * @param rules
     * @returns firstSets and followSets and predictSets
     */
    let NonTerminals: Set<string> = new Set()
    let firstSets: Map<string, Array<string>> = new Map()
    let followSets: Map<string, Array<string>> = new Map()
    let selectSets: Map<number, Array<string>> = new Map()
    let predictTable: Map<string, Map<string, number>> = new Map()

    rules.forEach(({ left }, index) => {
        NonTerminals.add(left)
        selectSets.set(index, [])
    })

    NonTerminals.forEach((NonTerminal) => {
        firstSets.set(NonTerminal, [])
        followSets.set(NonTerminal, [])
        predictTable.set(NonTerminal, new Map())
    })

    function union(arr1: string[], arr2: string[]) {
        return [...new Set([...arr1, ...arr2])]
    }

    function isNonterminal(item: string) {
        return NonTerminals.has(item)
    }

    function getFristSet(set: string[], right: string[]): string[] {
        if (right.length === 1) {
            if (!isNonterminal(right[0])) {
                return union(set, [right[0]])
            } else {
                return union(set, firstSets.get(right[0])!)
            }
        } else if (right.length >= 1) {
            if (!isNonterminal(right[0])) {
                return union(set, [right[0]])
            } else {
                if (!firstSets.get(right[0])!.includes("ε")) {
                    return union(set, firstSets.get(right[0])!)
                } else {
                    const temp = firstSets
                        .get(right[0])!
                        .filter((v: string) => v != "ε")
                    set = union(set, temp)
                    return getFristSet(set, right.slice(1))
                }
            }
        } else {
            return set
        }
    }

    function getFristSets(): Map<string, Array<string>> {
        while (true) {
            let isSetChanged = false
            for (const { left, right } of rules) {
                const a = firstSets.get(left)
                const set = getFristSet(firstSets.get(left)!, right)

                if (firstSets.get(left)!.length !== set.length) {
                    firstSets.set(left, set)
                    isSetChanged = true
                }
            }
            if (!isSetChanged) {
                break
            }
        }
        return firstSets
    }
    function getFollowSet(left: string, right: string[]): string[] {
        if (right.length === 1) {
            return followSets.get(left)!
        } else {
            if (isNonterminal(right[1])) {
                let set: Array<string> = firstSets
                    .get(right[1])!
                    .filter((item: string) => item != "ε")
                if (firstSets.get(right[1])!.includes("ε")) {
                    set = union(
                        set,
                        getFollowSet(left, [right[0], ...right.slice(2)])
                    )
                }
                return set
            } else {
                return [right[1]]
            }
        }
    }

    function getFollowSets(): Map<string, Array<string>> {
        followSets.set(rules[0].left, ["$"])
        while (true) {
            let isSetChanged = false
            for (const { left, right } of rules) {
                for (const [index, value] of right.entries()) {
                    if (!isNonterminal(value)) {
                        continue
                    }
                    const set = union(
                        followSets.get(value)!,
                        getFollowSet(left, right.slice(index))
                    )
                    if (followSets.get(value)!.length !== set.length) {
                        followSets.set(value, set)
                        isSetChanged = true
                    }
                }
            }
            if (!isSetChanged) {
                break
            }
        }
        return followSets
    }

    function getSelectSet(left: string, right: string[]): string[] {
        if (!isNonterminal(right[0])) {
            if (right[0] === "ε") {
                return followSets.get(left)!
            }
            return [right[0]]
        }
        let set = firstSets.get(right[0])!.filter((item: string) => item != "ε")
        if (right.length === 1) {
            return set
        } else {
            if (firstSets.get(right[0])!.includes("ε")) {
                set = union(set, getSelectSet(left, right.slice(1)))
            }
        }
        return set
    }
    function getSelectSets(): Map<number, Array<string>> {
        let index = 0
        for (const { left, right } of rules) {
            selectSets.set(index, getSelectSet(left, right))
            index++
        }
        return selectSets
    }

    function getPredictTable(): Map<string, Map<string, number>> {
        for (let i = 0; i < rules.length; i++) {
            for (let j = 0; j < selectSets.get(i)!.length; j++) {
                const key = selectSets.get(i)![j]
                if (!predictTable.get(rules[i].left)?.get(key)) {
                    predictTable.get(rules[i].left)?.set(key, i)
                } else {
                    console.log(
                        key,
                        predictTable.get(rules[i].left)?.get(key),
                        i,
                        "出现冲突"
                    )
                }
            }
        }

        for (const [key, values] of followSets.entries()) {
            for (const value of values) {
                if (!predictTable.get(key)?.has(value)) {
                    //  set syn(同步词法单元)，这里用-1表示SYN
                    predictTable.get(key)?.set(value, -1)
                }
            }
        }
        return predictTable
    }
    function predict(tokens: Array<Token>): Node {
        if (tokens[0].name === "TYPE") {
            tokens[0].value
        }
        const root = {
            type: "Program",
            line: 1,
            children: [],
            value: "",
        }
        const array: Array<Node> = [root]
        tokens.push({
            id: tokens.length,
            input: "$",
            name: "$",
            value: "",
            line: tokens[tokens.length - 1].line,
        })
        const set = new Set([
            "AND",
            "OR",
            "RELOP",
            "PLUS",
            "MINUS",
            "STAR",
            "DIV",
        ])
        const stack = ["$", rules[0].left]
        let current = 0
        while (stack.length > 1 && current < tokens.length) {
            const [token, nextToken] = [tokens[current], tokens[current + 1]]
            const line = token.line
            if (isNonterminal(stack[stack.length - 1])) {
                if (array[0].type === "Expression") {
                    if (set.has(nextToken.name)) {
                        const temp: Node[] = [
                            {
                                type: token.name,
                                line,
                                children: [],
                                value: token.value,
                            },
                            {
                                type: nextToken.name,
                                line,
                                children: [],
                                value: nextToken.value,
                            },
                            {
                                type: "Expression",
                                line,
                                children: [],
                                value: "",
                            },
                        ]
                        array[0].children = temp
                        array[0].line = line
                        array.shift()
                        array.unshift(temp[2])
                        current += 2
                        continue
                    } else {
                        array[0].children = [
                            {
                                type: token.name,
                                line,
                                children: [],
                                value: token.value,
                            },
                        ]
                        array[0].line = line

                        array.shift()
                        stack.pop()
                        current++
                        continue
                    }
                }

                const index = predictTable
                    .get(stack[stack.length - 1])
                    ?.get(token.name)
                if (typeof index === "number") {
                    if (index === -1) {
                        console.warn(
                            `synch,弹出栈顶的非终结符${stack[stack.length - 1]}`
                        )
                        stack.pop()
                    } else {
                        console.log(
                            `${rules[index].right}替换${
                                stack[stack.length - 1]
                            }`
                        )
                        const temp: Node[] = []
                        rules[index].right.forEach((value) => {
                            temp.push({
                                type: value,
                                line: 0,
                                children: [],
                                value: "",
                            })
                        })
                        array[0].children = temp
                        array[0].line = line
                        array.shift()
                        array.unshift(...temp)
                        stack.pop()
                        stack.push(...[...rules[index].right].reverse())
                    }
                } else {
                    console.warn(`Syntax error at Line ${token.line}: `)
                    console.warn(
                        `栈顶非终结符${stack[stack.length - 1]}与当前输入符号${
                            token.name
                        }在预测分析表对应项中的信息为空`,
                        `恐慌模式忽略输入符号${token.name}`
                    )
                    current++
                }
            } else {
                if (stack[stack.length - 1] === "ε") {
                    array[0].line = line
                    array.shift()
                    stack.pop()
                    continue
                }
                if (stack[stack.length - 1] === token.name) {
                    console.log(
                        `栈顶终结符${stack[stack.length - 1]}和当前输入符号${
                            token.name
                        }匹配`,
                        `弹出栈顶终结符${stack[stack.length - 1]}`
                    )
                    array[0].value = token.value
                    array[0].line = line
                    array.shift()
                    stack.pop()
                    current++
                } else {
                    console.warn(`Syntax error at Line ${line}: `)
                    console.warn(
                        `栈顶的终结符${stack[stack.length - 1]}和当前输入符号${
                            token.name
                        }不匹配`,
                        `恐慌模式弹出当前栈底终结符${stack[stack.length - 1]}`
                    )
                    array[0].line = line
                    array.shift()
                    stack.pop()
                    current++
                }
            }
        }
        if (current === tokens.length - 1) {
            console.log("匹配完成")
        }

        return root
    }

    firstSets = getFristSets()
    followSets = getFollowSets()
    selectSets = getSelectSets()
    predictTable = getPredictTable()
    return {
        firstSets,
        followSets,
        selectSets,
        predictTable,
        predict,
        NonTerminals,
    }
}

/**
 * preorder AST traversal
 * @param node AST root node
 * @returns array of string to be displayed on web page
 */
export function printAST(node: Node): Array<string> {
    let result: Array<string> = []

    function printAllChildren(node: Node, depth: number = 0): void {
        result.push(
            new Array(depth + 1).join("    ") + node.type + `(${node.line})`
        )
        if (node.children) {
            node.children!.forEach((child) => {
                printAllChildren(child, depth + 1)
            })
        }
    }
    printAllChildren(node)

    return result
}
