import React, { useState } from "react"
import AppBar from "@material-ui/core/AppBar"
import Toolbar from "@material-ui/core/Toolbar"
import Typography from "@material-ui/core/Typography"
import Button from "@material-ui/core/Button"
import tokenizer from "../compiler/tokenizer"
import { Token, Node } from "../compiler/types"
import parser, { rules } from "../compiler/parser"

interface HeaderProps {
    code: string
    setCode: React.Dispatch<React.SetStateAction<string>>
    setTokens: React.Dispatch<React.SetStateAction<Token[]>>
    setAst: React.Dispatch<React.SetStateAction<Node | null>>
    setTableVisibility: React.Dispatch<
        React.SetStateAction<"hidden" | "visible">
    >
}

const { predict } = parser(rules)

export default function Header(props: HeaderProps) {
    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        if (!event.target.files || event.target.files.length === 0) {
            return
        }
        const file = event.target.files[0]
        const reader = new FileReader()
        reader.readAsText(file)
        reader.onload = function () {
            if (typeof reader.result === "string") {
                props.setCode(reader.result)
            }
        }
    }
    return (
        <AppBar
            className="AppBar"
            position="static"
            style={{ background: "#F5F5F5" }}
        >
            <Toolbar
                style={{ display: "flex", justifyContent: "space-between" }}
            >
                <Typography variant="h6" style={{ color: "black" }}>
                    Simple Compiler
                </Typography>

                <input
                    type="file"
                    id="contained-button-file"
                    style={{ display: "none" }}
                    onChange={handleChange}
                ></input>
                <label htmlFor="contained-button-file">
                    <Button
                        variant="text"
                        component="span"
                        style={{ fontSize: "16px" }}
                    >
                        Upload
                    </Button>
                </label>
                <Button
                    onClick={() => {
                        props.setTokens(tokenizer(props.code))
                        props.setTableVisibility("visible")
                    }}
                >
                    <Typography variant="h6" style={{ fontSize: "18px" }}>
                        词法分析
                    </Typography>
                </Button>
                <Button
                    onClick={() => {
                        props.setAst(predict(tokenizer(props.code)))
                    }}
                >
                    <Typography variant="h6" style={{ fontSize: "18px" }}>
                        语法分析
                    </Typography>
                </Button>
            </Toolbar>
        </AppBar>
    )
}
