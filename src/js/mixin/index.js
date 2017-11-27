import Class from './class';
import Container from './container';
import Modal from './modal';
import Position from './position';
import Togglable from './togglable';
import Priority from './priority';
import Nooverlap from './nooverlap';

export { Class, Container, Modal, Position, Togglable, Priority, Nooverlap };

export default function (UIkit) {

    UIkit.mixin.priority = Priority;
    UIkit.mixin.nooverlap = Nooverlap;
    UIkit.mixin.class = Class;
    UIkit.mixin.container = Container;
    UIkit.mixin.modal = Modal;
    UIkit.mixin.position = Position;
    UIkit.mixin.togglable = Togglable;

}
