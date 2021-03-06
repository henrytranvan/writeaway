import { boundMethod } from 'autobind-decorator';
import ImageManager from 'imageManager/ImageManager';
import React, { Component } from 'react';
import type { IPieceProps, Rect } from '@writeaway/core';
import { WriteAwayImageTagData } from 'types';
import { imageManagerApi } from './imageManager/index';

export default class WriteAwayImageTag extends Component<IPieceProps> {
  /**
   * Specify component should have a separate node and is not modifying insides or outsides of target node
   * @type {string}
   */
  static readonly __renderType: string = 'BEFORE';

  static readonly editLabel: string = 'Click to Edit Image';

  static readonly label: string = 'Images';

  static readonly applyEditor = (node: HTMLElement, data: WriteAwayImageTagData) => {
    if (!node) {
      return;
    }
    const n: HTMLImageElement = node as HTMLImageElement;
    n.src = data.src || '';
    n.alt = data.alt || '';
    n.setAttribute('title', data.title || '');
  };

  private active: boolean; // TODO: Refactor to store in state?

  private rect?: Rect; // TODO: Refactor to store in state?

  private imageManagerApi: ImageManager | null = null;

  constructor(props: IPieceProps) {
    super(props);

    if (this.piece.node.nodeName !== 'IMG') {
      throw new Error('Image editor should be set on image');
    }

    this.state = {};
    this.active = false; // TODO: Think how to do that more "react" way.
    // This flag allows to handle events bound to PARENT node. Ideally we should not have parent node at all.
  }

  get piece() {
    return this.props.piece;
  }

  get actions() {
    return this.props.actions;
  }

  /**
   * That is a common public method that should activate component editor if it presents
   */
  activateEditor() {
    if (this.props.editorActive && !this.imageManagerApi?.state.isVisible) {
      this.onToggleImagePopup();
    }
  }

  deactivateEditor() {
    if (this.props.editorActive && this.imageManagerApi?.state.isVisible) {
      this.closePopup();
    }
  }

  UNSAFE_componentWillReceiveProps(newProps: IPieceProps) {
    if (newProps.piece.manualActivation) {
      this.props.actions.onManualActivation(this.piece.id);
      this.activateEditor();
    }
    if (newProps.piece.manualDeactivation) {
      this.props.actions.onManualDeactivation(this.piece.id);
      this.deactivateEditor();
    }
  }

  componentDidMount() {
    imageManagerApi({
      api: this.props.api,
      container: this.props.wrapper,
      ref: (i: ImageManager | null) => {
        this.imageManagerApi = i;
      },
    });
    this.check();
    const nodeRect = this.props.api.getNodeRect(this.piece);
    this.rect = nodeRect.hover || nodeRect.node;
  }

  onToggleImagePopup() {
    if (!this.imageManagerApi) {
      throw new Error('Trying to toggle popup with non existing ImageManager');
    }
    this.imageManagerApi.setImageData({
      data: {
        src: (this.piece.node as HTMLImageElement).src,
        alt: (this.piece.node as HTMLImageElement).alt || '',
        title: this.piece.node.getAttribute('title') || '',
        width: (this.piece.node as HTMLImageElement).width,
        height: (this.piece.node as HTMLImageElement).height,
      },
      pieceRef: {
        type: this.piece.type,
        data: this.piece.data,
        id: this.piece.id,
        dataset: this.piece.dataset,
      },
      onClose: this.cancelCallback,
      onSave: this.saveCallback,
      settings: {
        editDimensions: false,
        editBackground: false,
      },
    });
    this.imageManagerApi.showPopup();
    if (this.actions.onEditorActive) {
      this.actions.onEditorActive(this.piece.id, true);
    }
  }

  closePopup() {
    this.imageManagerApi?.onClose();
  }

  @boundMethod
  saveCallback(data: WriteAwayImageTagData) {
    this.renderNonReactAttributes(data);
    this.actions.updatePiece(this.piece.id, { data: { src: data.src, alt: data.alt, title: data.title } });
    this.actions.savePiece(this.piece.id);
    if (this.actions.onEditorActive) {
      this.actions.onEditorActive(this.piece.id, false);
    }
  }

  @boundMethod
  cancelCallback() {
    if (this.actions.onEditorActive) {
      this.actions.onEditorActive(this.piece.id, false);
    }
  }

  @boundMethod
  onClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.onToggleImagePopup();
  }

  /**
   * Ensures editor is enabled
   */
  componentInit() {
    if (!this.active && this.piece.node) {
      this.piece.node.addEventListener('click', this.onClick);
      this.piece.node.classList.add('r_editor');
      this.piece.node.classList.add('r_edit');
      this.active = true;
    }
  }

  shouldComponentUpdate(nextProps: IPieceProps) {
    return (nextProps.piece.data?.src !== this.piece.data?.src
      || nextProps.piece.data?.alt !== this.piece.data?.alt
      || nextProps.piece.data?.title !== this.piece.data?.title
      || nextProps.editorActive !== this.props.editorActive);
  }

  /**
   * Ensures editor is disabled
   */
  die() {
    if (this.active && this.piece.node) {
      this.piece.node.removeEventListener('click', this.onClick);
      this.piece.node.classList.remove('r_editor');
      this.piece.node.classList.remove('r_edit');
      this.active = false;
    }
  }

  /**
   * Based on external prop ensures editor is enabled or disabled and attaches-detaches non-react bindings
   */
  check() {
    if (this.props.editorActive) {
      this.componentInit();
    } else {
      this.die();
    }
  }

  /**
   * Updates rendering of props that are not updated by react
   * Here that updates IMG tag src and alt
   */
  renderNonReactAttributes(data?: WriteAwayImageTagData) {
    if (data) {
      WriteAwayImageTag.applyEditor((this.piece.node as HTMLImageElement), data);
    }
  }

  componentWillUnmount() {
    this.die();
    // eslint-disable-next-line no-console
    console.log(`Image editor ${this.piece.id} unmounted`);
  }

  render() {
    this.check();
    this.renderNonReactAttributes(this.piece.data);
    return <div data-editor-for={this.piece.name} />;
  }

  componentDidUpdate() {
    this.checkifResized();
  }

  checkifResized() {
    const nodeRect = this.props.api.getNodeRect(this.piece);
    const rect = nodeRect.hover || nodeRect.node;
    if (this.changedBoundingRect(rect)) { // TODO was checking 'this.nodeWasUpdated' here that is never changed anywhere
      this.setBoundingRect(rect);
      if (this.props.actions.onNodeResized) {
        this.props.actions.onNodeResized(this.piece.id);
      }
    }
  }

  /**
   * Check if node size is different
   * @param rect {ClientRect}
   */
  changedBoundingRect(rect: Rect) {
    return !this.rect
      || this.rect.top !== rect.top
      || this.rect.left !== rect.left
      || this.rect.bottom !== rect.bottom
      || this.rect.right !== rect.right;
  }

  /**
   * Store node size
   * @param rect {ClientRect}
   */
  setBoundingRect(rect: Rect) {
    this.rect = rect;
  }
}
