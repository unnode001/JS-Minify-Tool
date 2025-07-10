import { Node } from 'estree';
import { Visitor } from './types';

/**
 * 简单的AST遍历器实现
 */
function walkNode(node: Node, visitor: Visitor, parent: Node | null = null): void {
    if (!node) return;

    const nodeType = node.type;

    // 进入节点
    if (visitor[nodeType]) {
        const nodeVisitor = visitor[nodeType];

        if (typeof nodeVisitor === 'function') {
            nodeVisitor(node, parent);
        } else if (nodeVisitor && nodeVisitor.enter) {
            nodeVisitor.enter(node, parent);
        }
    }

    if (visitor.enter && typeof visitor.enter === 'function') {
        visitor.enter(node, parent);
    }

    // 递归遍历子节点
    for (const key in node) {
        if (key === 'type' || key === 'start' || key === 'end') continue;

        const value = (node as any)[key];
        if (Array.isArray(value)) {
            value.forEach(child => {
                if (child && typeof child === 'object' && child.type) {
                    walkNode(child, visitor, node);
                }
            });
        } else if (value && typeof value === 'object' && value.type) {
            walkNode(value, visitor, node);
        }
    }

    // 离开节点
    if (visitor[nodeType]) {
        const nodeVisitor = visitor[nodeType];
        if (typeof nodeVisitor !== 'function' && nodeVisitor && nodeVisitor.exit) {
            nodeVisitor.exit(node, parent);
        }
    }

    if (visitor.exit && typeof visitor.exit === 'function') {
        visitor.exit(node, parent);
    }
}

/**
 * AST 遍历器
 * 提供深度优先遍历 AST 的能力，并在进入和离开每个节点时触发回调
 */
export class Traverser {
    /**
     * 遍历 AST 并应用访问者模式
     */
    traverse(ast: Node, visitor: Visitor): void {
        walkNode(ast, visitor);
    }
}

/**
 * 便捷的遍历函数
 */
export function traverse(ast: Node, visitor: Visitor): void {
    const traverser = new Traverser();
    traverser.traverse(ast, visitor);
}
