import { Token } from "./types";

const keywords = [
    "auto",
    "double",
    "int",
    "struct",
    "break",
    "else",
    "long",
    "switch",
    "case",
    "enum",
    "register",
    "typedef",
    "char",
    "extern",
    "return",
    "union",
    "const",
    "float",
    "short",
    "unsigned",
    "continue",
    "for",
    "signed",
    "void",
    "default",
    "goto",
    "sizeof",
    "volatile",
    "do",
    "if",
    "static",
    "while",
];

/**
 * Lexical Analysis
 * @param input code input
 * @returns tokens array
 */
export default function tokenizer(input: string): Array<Token> {
    let current: number = 0;
    let tokens: Array<Token> = [];
    let line = 1;
    let id = 1;

    // some regex for later use
    const NUMBER = /^[0-9]/;
    const LETTER = /^[a-zA-Z]/;
    const NEWLINE = /^\n/;
    const WHITESPACE = /^\s/;
    const DECIMAL = /^([1-9][0-9]*)|^0/;
    const OCTAL = /^0[0-7]*/;
    const HEXADECIMAL = /^0[xX][0-9a-fA-F]*/;
    const FLOAT = /^([0-9]+\.[0-9]+)|([0-9]*\.[0-9]*[Ee][+-]?[0-9]+)/;
    const STRING = /^"[^"]*"|^'[^']*'/;

    while (current < input.length) {
        let char = input[current];
        if (NEWLINE.test(char)) {
            current++;
            line++;
            continue;
        }

        if (WHITESPACE.test(char)) {
            current++;
            continue;
        }

        if (input.slice(current).match(FLOAT)) {
            let value = input.slice(current).match(FLOAT)![0];
            current += value.length;
            tokens.push({
                id: id++,
                input: value,
                name: "FLOAT",
                value: value,
            });
            continue;
        }

        if (input.slice(current).match(HEXADECIMAL)) {
            let value = input.slice(current).match(HEXADECIMAL)![0];
            current += value.length;
            tokens.push({
                id: id++,
                input: value,
                name: "INT",
                value: value,
            });
            continue;
        }

        if (input.slice(current).match(OCTAL)) {
            let value = input.slice(current).match(OCTAL)![0];
            current += value.length;
            tokens.push({
                id: id++,
                input: value,
                name: "INT",
                value: value,
            });
            continue;
        }

        if (input.slice(current).match(DECIMAL)) {
            let value = input.slice(current).match(DECIMAL)![0];
            current += value.length;
            tokens.push({
                id: id++,
                input: value,
                name: "INT",
                value: value,
            });
            continue;
        }

        if (input.slice(current).match(STRING)) {
            let value = input.slice(current).match(STRING)![0];
            current += value.length;
            value = value.slice(1, value.length - 1);
            tokens.push({
                id: id++,
                input: value,
                name: "STRING",
                value: value,
            });
            continue;
        }

        if (char === ";") {
            tokens.push({
                id: id++,
                input: ";",
                name: "SEMI",
                value: ";",
            });
            current++;
            continue;
        }

        if (char === ",") {
            tokens.push({
                id: id++,
                input: ",",
                name: "COMMA",
                value: ",",
            });
            current++;
            continue;
        }

        if (char === "=") {
            const next = current + 1;
            if (input[next] === "=") {
                tokens.push({
                    id: id++,
                    input: "==",
                    name: "RELOP",
                    value: "==",
                });
                current = next + 1;
                continue;
            } else {
                tokens.push({
                    id: id++,
                    input: "=",
                    name: "ASSIGNOP",
                    value: "=",
                });
                current++;
                continue;
            }
        }
        if (char === "!") {
            const next = current + 1;
            if (input[next] === "=") {
                tokens.push({
                    id: id++,
                    input: "!=",
                    name: "RELOP",
                    value: "!=",
                });
                current = next + 1;
                continue;
            }
        }

        if (char === "<" || char === ">") {
            const next = current + 1;
            if (input[next] === "=") {
                tokens.push({
                    id: id++,
                    input: char + "=",
                    name: "RELOP",
                    value: char + "=",
                });
                current = next + 1;
                continue;
            } else {
                tokens.push({
                    id: id++,
                    input: char,
                    name: "RELOP",
                    value: char,
                });
                current++;
                continue;
            }
        }

        if (char === "+") {
            const next = current + 1;
            if (input[next] === "+") {
                tokens.push({
                    id: id++,
                    input: "++",
                    name: "INCREMENT",
                    value: "++",
                });
                current = next + 1;
                continue;
            } else {
                tokens.push({
                    id: id++,
                    input: "+",
                    name: "PLUS",
                    value: "+",
                });
                current++;
                continue;
            }
        }
        if (char === "-") {
            const next = current + 1;
            if (input[next] === "-") {
                tokens.push({
                    id: id++,
                    input: "--",
                    name: "DECREMENT",
                    value: "--",
                });
                current = next + 1;
                continue;
            } else {
                tokens.push({
                    id: id++,
                    input: "-",
                    name: "MINUS",
                    value: "-",
                });
                current++;
                continue;
            }
        }
        if (char === "*") {
            tokens.push({
                id: id++,
                input: "*",
                name: "STAR",
                value: "*",
            });
            current++;
            continue;
        }
        if (char === "%") {
            tokens.push({
                id: id++,
                input: "*",
                name: "MOD",
                value: "%",
            });
            current++;
            continue;
        }
        // comments
        if (char === "/") {
            //  one line comments
            const next = current + 1;
            if (input[next] === "/") {
                while (!NEWLINE.test(input[current])) {
                    current++;
                }
            }
            //  multilne comments
            else if (input[next] === "*") {
                current = next;
                while (true) {
                    current++;
                    if (input[current] === "*" && input[++current] === "/") {
                        current++;
                        break;
                    }
                }
            }
            // a single slash
            else {
                tokens.push({
                    id: id++,
                    input: "/",
                    name: "DIV",
                    value: "/",
                });
                current++;
                continue;
            }
        }

        if (char === "&" && input[current + 1] === "&") {
            tokens.push({
                id: id++,
                input: "&&",
                name: "AND",
                value: "&&",
            });
            current += 2;
            continue;
        }
        if (char === "|" && input[current + 1] === "|") {
            tokens.push({
                id: id++,
                input: "||",
                name: "OR",
                value: "||",
            });
            current += 2;
            continue;
        }
        if (char === ".") {
            tokens.push({
                id: id++,
                input: ".",
                name: "DOT",
                value: ".",
            });
            current++;
            continue;
        }
        if (char === "!") {
            tokens.push({
                id: id++,
                input: "!",
                name: "NOT",
                value: "!",
            });
            current++;
            continue;
        }
        if (char === "(") {
            tokens.push({
                id: id++,
                input: "(",
                name: "LP",
                value: "(",
            });
            current++;
            continue;
        }

        if (char === ")") {
            tokens.push({
                id: id++,
                input: ")",
                name: "RP",
                value: ")",
            });
            current++;
            continue;
        }
        if (char === "[") {
            tokens.push({
                id: id++,
                input: "[",
                name: "LB",
                value: "[",
            });
            current++;
            continue;
        }
        if (char === "]") {
            tokens.push({
                id: id++,
                input: "]",
                name: "RB",
                value: "]",
            });
            current++;
            continue;
        }

        if (char === "{") {
            tokens.push({
                id: id++,
                input: "{",
                name: "LC",
                value: "{",
            });
            current++;
            continue;
        }
        if (char === "}") {
            tokens.push({
                id: id++,
                input: "}",
                name: "RC",
                value: "}",
            });
            current++;
            continue;
        }

        /* check identifier(LETTERS,NUMBERS and UNDERLINE,
          must start with LETTERS or UNDERLINE)     */
        if (LETTER.test(char) || char === "_") {
            let value = "";
            while (LETTER.test(char) || NUMBER.test(char) || char === "_") {
                value += char;
                char = input[++current];
            }
            // check keyword
            if (keywords.includes(value)) {
                if (
                    [
                        "int",
                        "float",
                        "void",
                        "char",
                        "short",
                        "long",
                        "double",
                    ].includes(value)
                ) {
                    tokens.push({
                        id: id++,
                        input: value,
                        name: "TYPE",
                        value: value,
                    });
                } else {
                    tokens.push({
                        id: id++,
                        input: value,
                        name: value.toUpperCase(),
                        value: value,
                    });
                }
            } else {
                tokens.push({
                    id: id++,
                    input: value,
                    name: "ID",
                    value: value,
                });
            }
            continue;
        }
        console.log(
            `Lexical error at Line${line} :Type Error! Unrecognized Character: ${char}`
        );
        current++;
    }

    return tokens;
}