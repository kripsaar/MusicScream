import * as React from 'react';

interface IArtistPageProps
{
    id : number;
}

interface IArtistPageState
{

}

export class ArtistPage extends React.Component<IArtistPageProps, IArtistPageState>
{
    constructor(props: IArtistPageProps, state: IArtistPageState)
    {
        super(props, state);
    }

    public render()
    {
        return <div>
                {"Artist ID: " + this.props.id}
            </div>
    }
}