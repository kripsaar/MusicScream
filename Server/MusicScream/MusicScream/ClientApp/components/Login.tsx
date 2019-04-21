import * as React from 'react';
import { User } from '../Models/UserModel';
import { Form, FormGroup, ControlLabel, FormControl, Col, Checkbox, Button } from 'react-bootstrap';
import AuthService from '../util/AuthService';

interface ILoginState
{
    user: User
}

export class Login extends React.Component<{},ILoginState>
{
    constructor(props: {}, state: ILoginState)
    {
        super(props, state);
        this.state = {user: {id: 0, username: "", password: "", permissions:[], token: ""}}
    }

    private onUsernameChange(e: any)
    {
        var user = this.state.user;
        user.username = e.currentTarget.value;
        this.setState({user: user});
    }

    private onPasswordChange(e: any)
    {
        var user = this.state.user;
        user.password = e.currentTarget.value;
        this.setState({user: user});
    }

    private handleFormSubmit(e: React.FormEvent<Form>)
    {
        e.preventDefault();
        e.stopPropagation();

        AuthService.login(this.state.user);
    }

    render()
    {
        return (
            <div style={{justifyContent:"center", alignItems:"center", display:"flex", height: "100%"}}>
                <Form 
                    style={{minWidth:"400px"}}
                    onSubmit={this.handleFormSubmit.bind(this)}
                >
                    <FormGroup controlId="formBasicUsername">
                        <ControlLabel>Username</ControlLabel>
                        <FormControl
                            type="text"
                            value={this.state.user.username}
                            placeholder="Enter Username"
                            onChange={this.onUsernameChange.bind(this)}
                        />
                    </FormGroup>
                    <FormGroup controlId="formBasicPassword">
                        <ControlLabel>Password</ControlLabel>
                        <FormControl
                            type="password"
                            value={this.state.user.password}
                            placeholder="Enter Password"
                            onChange={this.onPasswordChange.bind(this)}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Col>
                            <Checkbox>Remember me</Checkbox>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col>
                            <Button type="submit">Sign in</Button>
                        </Col>
                    </FormGroup>
                </Form>
            </div>
        );
    }
}