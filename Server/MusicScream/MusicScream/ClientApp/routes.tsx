import * as React from 'react';
import { Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { MusicPlayer } from './components/MusicPlayer/MusicPlayer'
import { SongList } from './components/MusicPlayer/SongList';
import { ArtistPage } from './components/Views/Artist/ArtistPage';

export const routes = <Layout>
    <Route exact path='/' component={ Home } />
    <Route path='/MusicPlayer' component={ MusicPlayer as any } />
    <Route path='/songlist' component={ SongList as any } />
    <Route path='/Artist/:id' render={ (props) => <ArtistPage id={props.match.params.id}/> } />
</Layout>;
