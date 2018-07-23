import * as React from 'react';
import { NavMenu } from './NavMenu';
import { MusicPlayer, MusicPlayerInstance } from './MusicPlayer/MusicPlayer';
import { MusicPlayerControls } from './MusicPlayer/MusicPlayerControls';

export interface LayoutProps {
    children?: React.ReactNode;
}

export class Layout extends React.Component<LayoutProps, {}> {

    public render() {
        return <div className='container-fluid'>
            <div className='row'>
                <div className='col-sm-3'>
                    <NavMenu />
                </div>
                <div className='col-sm-9'>
                    { this.props.children }
                </div>
            </div>
            <div style={{position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 2}}>
                <MusicPlayerControls/>
            </div>
        </div>;
    }
}
