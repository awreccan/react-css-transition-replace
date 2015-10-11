/**
 * Adapted from ReactCSSTransitionGroup.js by Facebook
 *
 * @providesModule ReactReactCSSTransitionReplace
 */

import React from 'react';
import ReactDOM from 'react-dom';
import objectAssign from 'react/lib/Object.assign';
import ReactTransitionGroup from 'react-addons-transition-group';

import emptyFunction from 'react/node_modules/fbjs/lib/emptyFunction';

import ReplaceChildComponent from 'react/lib/ReactCSSTransitionGroupChild';

const reactCSSTransitionReplaceChild = React.createFactory(ReplaceChildComponent);

function createTransitionTimeoutPropValidator(transitionType) {
  const timeoutPropName = 'transition' + transitionType + 'Timeout';
  const enabledPropName = 'transition' + transitionType;

  return function(props) {
    // If the transition is enabled
    if (props[enabledPropName]) {
      // If no timeout duration is provided
      if (!props[timeoutPropName]) {
        return new Error(timeoutPropName + ' wasn\'t supplied to ReactCSSTransitionReplace: '
                         + 'this can cause unreliable animations and won\'t be supported in '
                         + 'a future version of React. See '
                         + 'https://fb.me/react-animation-transition-group-timeout for more ' + 'information.');

        // If the duration isn't a number
      }
      else if (typeof props[timeoutPropName] !== 'number') {
        return new Error(timeoutPropName + ' must be a number (in milliseconds)');
      }
    }
  };
}

export default class ReactCSSTransitionReplace extends React.Component {

  static propTypes = {
    transitionName: React.PropTypes.string.isRequired,
    transitionAppear: React.PropTypes.bool,
    transitionEnter: React.PropTypes.bool,
    transitionLeave: React.PropTypes.bool,
    transitionHeight: React.PropTypes.bool,
    transitionAppearTimeout: createTransitionTimeoutPropValidator('Appear'),
    transitionEnterTimeout: createTransitionTimeoutPropValidator('Enter'),
    transitionLeaveTimeout: createTransitionTimeoutPropValidator('Leave')
  };

  static defaultProps = {
    transitionAppear: false,
    transitionEnter: true,
    transitionLeave: true,
    transitionHeight: true,
    component: 'span'
  };

  state = {
    currentChild: React.Children.only(this.props.children),
    nextChild: null,
    height: 'auto'
  };

  componentWillReceiveProps(nextProps) {
    const nextChild = nextProps.children ? React.Children.only(nextProps.children) : null;
    const currentChild = this.state.currentChild;

    if (currentChild && nextChild && nextChild.key === currentChild.key) {
      // Nothing changed, but we are re-rendering so update the currentChild.
      return this.setState({
        currentChild: nextChild
      });
    }

    this.setState({
      nextChild
    });
  }

  componentDidUpdate() {
    if (this.state.nextChild) {
      this.enterNext();
      this.leaveCurrent();
    }
  }

  _wrapChild = (child, moreProps) => {
    // We need to provide this childFactory so that
    // ReactCSSTransitionReplaceChild can receive updates to name,
    // enter, and leave while it is leaving.
    return reactCSSTransitionReplaceChild(objectAssign({
      name: this.props.transitionName,
      appear: this.props.transitionAppear,
      enter: this.props.transitionEnter,
      leave: this.props.transitionLeave,
      appearTimeout: this.props.transitionAppearTimeout,
      enterTimeout: this.props.transitionEnterTimeout,
      leaveTimeout: this.props.transitionLeaveTimeout,
      onEntered: this._childEntered,
      onLeft: this._childLeft
    }, moreProps), child);
  }

  enterNext() {
    this.refs.next.componentWillEnter(this._handleDoneEntering);
  }

  _handleDoneEntering = () => {
    this.setState({
      currentChild: this.state.nextChild,
      nextChild: null
    });
  }

  leaveCurrent() {
    this.refs.curr.componentWillLeave(this._handleDoneLeaving);
  }

  render() {
    let { currentChild, nextChild } = this.state;
    let containerProps = this.props;
    const childrenToRender = [];

    if (currentChild) {
      childrenToRender.push(this._wrapChild(currentChild, {
        ref: 'curr', key: 'curr'
      }));
    }

    if (nextChild) {
      const style = objectAssign({}, this.props.style, {
        position: 'relative',
        overflow: 'hidden',
        display: 'block'
      });

      containerProps = objectAssign({}, this.props, {style});

      const nextChildStyle = objectAssign({}, nextChild.props.style, {
        position: 'absolute',
        left: 0,
        top: 0
      });

      childrenToRender.push(
        React.createElement('span', {
          style: nextChildStyle,
          key: 'next'
        }, this._wrapChild(nextChild, {ref: 'next'}))
      );
    }

    return React.createElement(this.props.component, containerProps, childrenToRender);
  }
}
