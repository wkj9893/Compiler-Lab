import { Node, Symbol } from "./types"

export default class Analyzer {
    root: Node
    table: Map<string, string>
    code: Array<string>
    count: number
    map: Map<string, string>

    constructor(root: Node) {
        this.root = root
        this.table = new Map()
        this.code = []
        this.count = 1
        this.map = new Map([
            ["PLUS", "+"],
            ["MINUS", "-"],
            ["STAR", "*"],
            ["DIV", "/"],
        ])
        this.analyze()
        console.log(this.table)
        console.log(this.code)
    }
    analyze() {
        this.Program(this.root)
    }
    // Program -> ε
    // Program -> VariableDeclaration SEMI Program
    // Program -> StructDeclaration SEMI Program
    // Program -> Assignment SEMI Program
    // Program -> IfStatement Program
    // Program -> WhileStatement Program
    // Program -> DoWhileStatement SEMI Program
    Program(node: Node) {
        if (node.children.length === 1) {
            return
        }

        const child = node.children[0]
        if (child.type === "VariableDeclaration") {
            this.VariableDeclaration(child)
        }
        if (child.type === "StructDeclaration") {
            this.StructDeclaration(child)
        }
        if (child.type === "IfStatement") {
            this.IfStatement(child)
        }
        if (child.type === "DoWhileStatement") {
            this.DoWhileStatement(child)
        }
        const last = node.children[node.children.length - 1]
        this.Program(last)
    }

    //  VariableDeclaration -> TYPE ID Init
    //  VariableDeclaration -> ID Init
    VariableDeclaration(node: Node) {
        if (node.children[0].type === "TYPE") {
            if (this.table.has(node.children[1].value)) {
                console.warn(
                    `Semantic error at Line ${node.line}:`,
                    `变量${node.children[1].value}重复声明`
                )

                return
            } else {
                this.table.set(node.children[1].value, node.children[0].value)
                this.Init(node.children[2], node.children[1])
            }
        } else {
            if (!this.table.has(node.children[0].value)) {
                console.warn(
                    `Semantic error at Line ${node.line}:`,
                    `变量${node.children[0].value}未经声明就使用`
                )
            } else {
                this.Init(node.children[1], node.children[0])
            }
        }
    }

    // Init -> ASSIGNOP Expression
    // Init -> ε
    // Init -> LB INT RB Init
    Init(node: Node, ID: Node) {
        if (node.children[0].type === "ASSIGNOP") {
            this.Expression(node.children[1])
            this.code.push(
                `${this.code.length + 1}  :(=,t${this.count}, ,${ID.value}) ${
                    ID.value
                } = t${this.count - 1}`
            )
        } else if (node.children[0].type === "LB") {
            if (
                this.table.get(ID.value) !== "int" &&
                this.table.get(ID.value) !== "float" &&
                this.table.get(ID.value) !== "char"
            ) {
                return
            }
            const temp = this.init(node.children[3], ID)
            this.table.set(
                ID.value,
                `array(${node.children[1].value},${temp ? temp : "int"})`
            )
        }
    }
    // Init -> LB INT RB Init
    init(node: Node, ID: Node): string {
        if (node.children.length === 1) {
            return this.table.get(ID.value) ?? ""
        }
        return `array(${node.children[1].value},${this.init(
            node.children[3],
            ID
        )})`
    }

    // Expression -> Expression AND Expression
    // Expression -> Expression OR Expression
    // Expression -> Expression RELOP Expression
    // Expression -> Expression PLUS Expression
    // Expression -> Expression MINUS Expression
    // Expression -> Expression STAR Expression
    // Expression -> Expression DIV Expression
    // Expression -> INT
    // Expression -> FLOAT
    Expression(node: Node) {
        if (node.children.length === 1) {
            this.code.push(
                `${this.code.length + 1}  :(=,${node.children[0].value}, ,t${
                    this.count
                }) t${this.count} = ${node.children[0].value}`
            )
            this.count++
        } else {
            if (node.children[2].children.length === 1) {
                if (node.children[1].type === "RELOP") {
                    this.code.push(
                        `${this.code.length + 1}  :(j${
                            node.children[1].value
                        },${node.children[0].value},${
                            node.children[2].children[0].value
                        },${this.code.length + 3})  if ${
                            node.children[0].value
                        }${node.children[1].value}${
                            node.children[2].children[0].value
                        } goto ${this.code.length + 3}`
                    )
                } else {
                    if (
                        node.children[0].type !==
                        node.children[2].children[0].type
                    ) {
                        console.warn(
                            `Semantic error at Line ${node.line}:`,
                            `赋值号两边的表达式类型不匹配(${node.children[0].type},${node.children[2].children[0].type})`
                        )
                    }

                    this.code.push(
                        `${this.code.length + 1}  :(${this.map.get(
                            node.children[1].type
                        )},${node.children[0].value},${
                            node.children[2].children[0].value
                        },t${this.count}) t${this.count} = ${
                            node.children[0].value
                        } ${this.map.get(node.children[1].type)} ${
                            node.children[2].children[0].value
                        }`
                    )
                    this.count++
                }
            }
        }
    }
    // StructDeclaration -> STRUCT ID LC StructBody RC
    // StructBody -> TYPE ID SEMI StructBody
    // StructBody -> ε
    StructDeclaration(node: Node) {
        this.table.set(
            node.children[1].value,
            `record(${this.StructBody(node.children[3])})`
        )
    }

    // StructBody -> TYPE ID SEMI StructBody
    // StructBody -> ε
    StructBody(node: Node): string {
        if (node.children.length <= 1) {
            return ""
        }
        const temp = this.StructBody(node.children[3])
        return `(${node.children[1].value}×${node.children[0].value})${
            temp ? " × " + temp : ""
        }`
    }

    //  IfStatement -> IF LP Expression RP LC Program RC ELSE LC Program RC
    IfStatement(node: Node) {
        this.Expression(node.children[2])
        this.code.push("")
        let index1 = this.code.length - 1
        this.Program(node.children[5])
        this.code.push("")
        const index2 = this.code.length - 1
        this.code[index1] = `${index1 + 1}  :(j, , ,${
            this.code.length + 1
        })  goto ${this.code.length + 1}`
        this.Program(node.children[9])
        this.code[index2] = `${index2 + 1}  :(j, , ,${
            this.code.length + 1
        })  goto ${this.code.length + 1}`
    }

    // DoWhileStatement -> DO LC Program RC WHILE LP Expression RP
    DoWhileStatement(node: Node) {
        const len = this.code.length
        this.Program(node.children[2])
        this.Expression(node.children[6])
        const str = this.code[this.code.length - 1].replace(
            /goto.*/,
            `goto ${len + 1}`
        )
        this.code[this.code.length - 1] = str
    }
}
