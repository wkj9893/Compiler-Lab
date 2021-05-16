export interface Token {
    id: number
    input: string
    name: string
    value: string
    line: number
}

export interface Rule {
    left: string
    right: Array<string>
}

export interface Node {
    type: string
    line: number
    children: Array<Node>
    value: string
}

export interface Symbol {
    type: string | Map<string, Symbol>
    typeString: string
}
