import * as React from 'react';
import * as ReactModal from 'react-modal';

interface IImageModalProps
{
    src: string;
    style?: React.CSSProperties;
}

interface IImageModalState
{
    showModal: boolean;
}

export class ImageModal extends React.Component<IImageModalProps, IImageModalState>
{
    constructor(props: IImageModalProps, state: IImageModalState)
    {
        super(props, state);
        this.state = {showModal: false};
    }

    private toggleVisibility()
    {
        this.setState({showModal: !this.state.showModal});
    }

    public render()
    {
        return <div style={this.props.style}>
                <img 
                    src={this.props.src} 
                    style={{height: "100%"}}
                    onClick={this.toggleVisibility.bind(this)}
                />
                <ReactModal
                    isOpen={this.state.showModal}
                    shouldFocusAfterRender={true}
                    shouldCloseOnEsc={true}
                    shouldCloseOnOverlayClick={true}
                    onRequestClose={this.setState.bind(this, {showModal: false})}
                    style={{
                        content:
                        {
                            position: "fixed",
                            left: "50%",
                            right: "undefined",
                            top: "calc(50% - 80px)",
                            bottom: "undefined",
                            transform: "translate(-50%, calc(-50% + 40px))"
                        }
                    }}
                    > 
                    <img 
                        src={this.props.src} 
                        onClick={this.toggleVisibility.bind(this)}
                        style={{maxHeight: "calc(100vh - 130px)"}}
                    />
                </ReactModal>
            </div>
    }
}

