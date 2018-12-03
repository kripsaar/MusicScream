import * as React from 'react';
import { Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { MusicPlayer } from './components/MusicPlayer/MusicPlayer'
import { PlaylistComponent } from './components/MusicPlayer/PlaylistComponent';
import { ArtistPage } from './components/Views/Artist/ArtistPage';
import { PlaylistPage } from './components/Views/Playlist/PlaylistPage';

export const routes = <Layout>
    <Route exact path='/' component={ Home } />
    <Route path='/MusicPlayer' component={ MusicPlayer as any } />
    <Route path='/songlist' component={ PlaylistComponent as any } />
    <Route path='/Artist/:id' render={ (props) => <ArtistPage id={props.match.params.id}/> } />
    <Route path='/Playlist/:id' render={(props) => <PlaylistPage id={props.match.params.id}/>}/>
</Layout>;
