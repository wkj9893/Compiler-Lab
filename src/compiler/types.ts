export interface Token {
    id: number
    input: string
    name: string
    value: string
}

export interface Rule {
    left: string
    right: Array<string>
}

export interface Node {
    type: string
    children?: Array<Node>
    value?: string
}
