import { BinaryExpression, BlockStatement, IfStatement, Literal, Node } from 'estree';
import { TransformationContext, TransformerPlugin } from '../types';

/**
 * 常量折叠插件
 * 对编译时可确定的表达式进行求值
 */
export const constantFoldingPlugin: TransformerPlugin = (context: TransformationContext) => {
    return {
        BinaryExpression: {
            exit: (node: Node) => {
                const binaryNode = node as BinaryExpression;

                // 检查左右操作数是否都是字面量
                if (binaryNode.left.type === 'Literal' && binaryNode.right.type === 'Literal') {
                    const leftLiteral = binaryNode.left as Literal;
                    const rightLiteral = binaryNode.right as Literal;

                    const result = evaluateBinaryExpression(
                        leftLiteral.value,
                        binaryNode.operator,
                        rightLiteral.value
                    );

                    if (result !== null) {
                        // 替换为计算结果的字面量节点
                        Object.assign(binaryNode, createLiteralNode(result));
                    }
                }
            }
        }
    };
};

/**
 * 布尔值优化插件
 * 优化布尔值和 undefined 的表示
 */
export const booleanOptimizationPlugin: TransformerPlugin = () => {
    return {
        Literal: (node: Node) => {
            const literal = node as Literal;

            // 这些优化将在代码生成阶段处理
            // 这里只是标记，实际替换在 generator 中进行
            if (typeof literal.value === 'boolean') {
                // true -> !0, false -> !1 将在生成器中处理
            } else if (literal.value === undefined) {
                // undefined -> void 0 将在生成器中处理
            }
        }
    };
};

/**
 * 死代码消除插件
 * 移除不可达的代码
 */
export const deadCodeEliminationPlugin: TransformerPlugin = () => {
    return {
        IfStatement: {
            exit: (node: Node) => {
                const ifNode = node as IfStatement;

                // 如果测试条件是字面量
                if (ifNode.test.type === 'Literal') {
                    const testLiteral = ifNode.test as Literal;

                    if (testLiteral.value) {
                        // if (true) { ... } -> 直接使用 consequent
                        if (ifNode.consequent.type === 'BlockStatement') {
                            const block = ifNode.consequent as BlockStatement;
                            // 这里需要更复杂的AST操作来替换节点
                            // 暂时只标记，实际实现需要父节点信息
                        }
                    } else {
                        // if (false) { ... } -> 使用 alternate 或删除
                        if (ifNode.alternate) {
                            if (ifNode.alternate.type === 'BlockStatement') {
                                const block = ifNode.alternate as BlockStatement;
                                // 替换为 alternate 块
                            }
                        } else {
                            // 完全删除 if 语句
                            // 需要父节点信息来实现
                        }
                    }
                }
            }
        }
    };
};

/**
 * 计算二元表达式的值
 */
function evaluateBinaryExpression(left: any, operator: string, right: any): any {
    try {
        switch (operator) {
            case '+':
                return left + right;
            case '-':
                return left - right;
            case '*':
                return left * right;
            case '/':
                return right !== 0 ? left / right : null;
            case '%':
                return right !== 0 ? left % right : null;
            case '**':
                return left ** right;
            case '==':
                return left == right;
            case '!=':
                return left != right;
            case '===':
                return left === right;
            case '!==':
                return left !== right;
            case '<':
                return left < right;
            case '<=':
                return left <= right;
            case '>':
                return left > right;
            case '>=':
                return left >= right;
            case '<<':
                return left << right;
            case '>>':
                return left >> right;
            case '>>>':
                return left >>> right;
            case '&':
                return left & right;
            case '|':
                return left | right;
            case '^':
                return left ^ right;
            case '&&':
                return left && right;
            case '||':
                return left || right;
            default:
                return null;
        }
    } catch {
        return null;
    }
}

/**
 * 创建字面量节点
 */
function createLiteralNode(value: any): Literal {
    return {
        type: 'Literal',
        value: value,
        raw: JSON.stringify(value),
    };
}
