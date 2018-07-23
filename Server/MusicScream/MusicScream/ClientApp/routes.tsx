import * as React from 'react';
import { Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { MusicPlayer } from './components/MusicPlayer/MusicPlayer'
import { SongList } from './components/MusicPlayer/SongList';

export const routes = <Layout>
    <Route exact path='/' component={ Home } />
    <Route path='/MusicPlayer' component={ MusicPlayer as any } />
    <Route path='/songlist' component={ SongList as any } />
</Layout>;
