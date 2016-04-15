import React, {Component} from "react";
import ReactDOM from "react-dom";

const formStyle = {
    background: "#fff"
};

const tabsStyle = {
    display: "flex"
};

const tabStyle = {
    outline: "1px solid gray",
    flex: "1 0 auto"
};


class Form extends Component {
    render() {
        return (
            <div style={formStyle}>
                <div style={tabsStyle}>
                    {this.props.tabs}
                </div>
                <div>
                    {this.props.children}
                </div>
            </div>
        )
    }
}

class MultipleElement extends Component {
    constructor(props) {
        super(props);
        //Math.random().toString(36).substr(16)
        this.mountEditMenu();
    }

    componentWillReceiveProps(nextProps) {
        // if (nextProps.edit) this.mountForm();
    }

    mountEditMenu() {
        let edit = document.createElement("BUTTON");
        edit.textContent = "Edit";
        const rect = this.props.node.getBoundingClientRect();
        edit.style.position = "fixed";
        edit.style.top = rect.top + "px";
        edit.style.right = rect.right - rect.width + "px";

        document.body.appendChild(edit);

        this._mountForm = this.mountForm.bind(this);
        edit.addEventListener("click", this._mountForm);
    }

    buildTabs() {
        return this.props.data.items.map((item, i) =>
            <div style={tabStyle}>{item.title || item.name || item.text || item.id}</div>);
    }

    mountForm() {
        this.formPanel = document.createElement("DIV");
        this.setState({
            index: 0
        });
        ReactDOM.render(
            <Form tabs={this.buildTabs()}>
                {this.buildForm()}
            </Form>,
            this.formPanel);
        const rect = this.props.node.getBoundingClientRect();
        this.formPanel.style.position = "fixed";
        this.formPanel.style.top = rect.top + rect.height + "px";
        this.formPanel.style.left = rect.left + "px";
        document.body.appendChild(this.formPanel);
    }

    change() {
        debugger;
    }
}


///////////////////////////

const Item = props => <a href={props.item.href} className="js-anchor">{props.item.text}</a>;

class Menu extends MultipleElement {

    formJSON() {
        return {
            text: {
                type: "text"
            },
            href: {
                type: "text"
            }
        }
    }

    buildForm() {
        const {text, href} = this.props.data.items[this.state.index];
        return (
            <div>
                <input value={text} onChange={e=>this.change("text", e.target.value)}/>
                <input value={href}/>
            </div>
        )
    }

    render() {
        return (
            <nav>
                {this.props.data.items.map(item => <Item item={item}/>)}
            </nav>
        )
    }
}

module.exports = Menu;