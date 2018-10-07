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
            <div className='row' style={{height: "calc(100vh - 80px)"}}>
                <div className='col-sm-3'>
                    <NavMenu />
                </div>
                <div className='col-sm-9' style={{height: "100%", overflowY: "auto"}}>
                    { this.props.children }
                </div>
            </div>
            <div style={{position: "relative", bottom: 0, left: "-15px", width: "100vw", height: "80px", zIndex: 2}}>
                <MusicPlayerControls/>
            </div>
        </div>;
    }
}
