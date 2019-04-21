import * as React from 'react';
import { Link, NavLink } from 'react-router-dom';
import AuthService from '../util/AuthService';
import { User, UserPermissions } from '../Models/UserModel';

export class NavMenu extends React.Component<{}, {}> {
    private buildMenuItems()
    {
        let menuItems: JSX.Element[] = [];
        let currentUser: User | null = AuthService.getCurrentUser();

        if (!currentUser)
            return [
                <li>
                    <NavLink to ={'/Login'} activeClassName='active'>
                        <span className='glyphicon glyphicon-log-in'></span> Login
                    </NavLink>
                </li>
            ];
        
        if (currentUser.permissions.indexOf(UserPermissions.BasicServiceRights) !== -1)
            menuItems = menuItems.concat([
                <li>
                    <NavLink to={ '/' } exact activeClassName='active'>
                        <span className='glyphicon glyphicon-home'></span> Home
                    </NavLink>
                </li>,
                <li>
                    <NavLink to={ '/Playlist/1' } activeClassName='active'>
                        <span className='glyphicon glyphicon-music'></span> Music Player
                    </NavLink>
                </li>
            ]);
        
        return menuItems;
    }
    
    public render() {
        let menuItems = this.buildMenuItems();

        return <div className='main-nav'>
                <div className='navbar navbar-inverse'>
                <div className='navbar-header'>
                    <button type='button' className='navbar-toggle' data-toggle='collapse' data-target='.navbar-collapse'>
                        <span className='sr-only'>Toggle navigation</span>
                        <span className='icon-bar'></span>
                        <span className='icon-bar'></span>
                        <span className='icon-bar'></span>
                    </button>
                    <Link className='navbar-brand' to={ '/' }>MusicScream</Link>
                </div>
                <div className='clearfix'></div>
                <div className='navbar-collapse collapse'>
                    <ul className='nav navbar-nav'>
                        {menuItems}
                    </ul>
                </div>
            </div>
        </div>;
    }
}
