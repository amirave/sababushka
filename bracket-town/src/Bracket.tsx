import { ReactNode } from "react";

class Bracket {
    content: (string | Bracket | ReactNode)[];
    answer: string | undefined;
    parent: Bracket | null;
    isInner: boolean = false;
    hintUsed: boolean;
    isSolved: any;

    constructor(content: (string | Bracket)[], answer: string | undefined) {
        this.content = content;
        this.answer = answer;
        this.parent = null;
        this.hintUsed = false;

        this.recalculateIsInner();
    }

    setParent(parent: Bracket) {
        this.parent = parent;
    }

    toText() {
        let text = '';

        this.content.forEach(elem => {
            if (elem instanceof Bracket)
                text += `[${elem.toText()}]`;
            else
                text += elem;
        });

        return text;
    }

    toDom(getHint: (bracket: Bracket) => void, lastAnswer: string | null) {
        let dom: (string | React.ReactNode)[] = [];

        this.content.forEach((elem, i) => {
            if (elem instanceof Bracket)
                if (elem.isSolved) {
                    const className = 'bracket' + (lastAnswer === elem.answer ? ' correct' : '');
                    dom.push((<span key={i} className={className}>{elem.answer}</span>))
                }
                else if (elem.isInner) {
                    const className = 'bracket ' + (elem.hintUsed ? 'hint' : 'highlight');
                    dom.push(
                        <span className={className} key={i} onClick={_ => getHint(elem)}>
                            [{elem.toDom(getHint, lastAnswer)}]
                        </span>
                    );
                }
                else {
                    dom.push(<span key={i} className='bracket regular'>[{elem.toDom(getHint, lastAnswer)}]</span>)
                }
            else
                dom.push(elem);
        });

        if (this.hintUsed)
            dom.push(` (${this.answer?.charAt(0)})`)

        return dom;
    }

    getAllInners(): Bracket[] {
        if (this.isInner)
            return [this];

        let inners: Bracket[] = [];

        for (let i = 0; i < this.content.length; i++) {
            const elem = this.content[i];

            if (!(elem instanceof Bracket))
                continue;

            inners = inners.concat(elem.getAllInners());
        }

        return inners;
    }

    getPath(): number[] {
        let p: Bracket = this;
        const path: number[] = [];

        while (p.parent != null) {
            path.push(p.parent.content.indexOf(p));
            p = p.parent;
        }

        return path.reverse();
    }

    find(path: number[]) {
        let b: Bracket = this;

        path.forEach(i => {
            if (!(b.content[i] instanceof Bracket))
                throw new Error(`[Bracket] failed to find path ${path.toString()} on bracket ${this.toText()}`);

            b = b.content[i];
        })

        return b;
    }

    collapse() {
        if (!this.parent)
            throw new Error(`Parent empty in bracket ${this.toText()}`);

        // const index = this.parent.content.indexOf(this);
        // this.parent.content[index] = (<span className="correct">{this.answer}</span>)

        this.isSolved = true;
        this.parent.recalculateIsInner();
    }

    revealLetter() {
        if (this.hintUsed)
            return;

        this.hintUsed = true;
        // // Add the first letter to the dom
        // this.content.push(` (${this.answer?.charAt(0)})`)
        // console.log(this.content);
    }

    recalculateIsInner() {
        let isInner = true;

        this.content.forEach(elem => {
            if (elem instanceof Bracket && !elem.isSolved)
                isInner = false;
        });

        this.isInner = isInner;
    }

    static create(text: string, thisAnswer: string | undefined = undefined): Bracket {
        let accum = '';
        let answer = undefined;
        let bracketCount = 0;

        let content: (string | Bracket)[] = [];

        content.push('');

        for (let i = 0; i < text.length; i++) {
            let ch = text.charAt(i);

            // If closing bracket in depth 0, parse it recursively
            if (ch === '\]') {
                bracketCount--;
                
                if (bracketCount > 0)
                    accum += ch;


                if (bracketCount == 0) {
                    if (answer === undefined)
                        throw new Error(`Bracket ${accum} does not have an answer`);

                    content.push(Bracket.create(accum, answer))
                    accum = '';
                    content.push('');
                    answer = undefined;
                }
            }
            // If opening bracket, mark as not inner
            else if (ch === '\[') {
                if (bracketCount > 0)
                    accum += ch;

                bracketCount++;
            }
            else if (ch === '|' && bracketCount == 1) {
                if (answer != undefined)
                    throw new Error(`Multiple answers in bracket ${text}`);

                answer = accum;
                accum = '';
            }
            else {
                // If in bracket, added to accum, else add to last content
                if (bracketCount > 0) {
                    accum += ch;
                } else {
                    content[content.length - 1] += ch;
                }
            }
        }

        const finalBracket = new Bracket(content, thisAnswer);

        content.forEach(elem => {
            if (elem instanceof Bracket)
                elem.setParent(finalBracket);
        })

        return finalBracket;
    }
}

export default Bracket;