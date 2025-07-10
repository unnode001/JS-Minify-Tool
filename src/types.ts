import { Node } from 'estree';

// 解析器接口
export interface ParserOptions {
    sourceType: 'module' | 'script';
    ecmaVersion: number;
    allowImportExportEverywhere?: boolean;
    allowReturnOutsideFunction?: boolean;
}

// 代码生成器接口
export interface GeneratorOptions {
    format?: {
        indent?: {
            style: string;
            base: number;
        };
        semicolons?: boolean;
        quotes?: 'single' | 'double' | 'auto';
    };
    comments?: boolean | 'all' | 'some';
    sourceMap?: boolean;
}

// 转换器接口
export interface TransformationContext {
    scopeManager: ScopeManager;
    options: MinifyOptions;
}

export interface Visitor {
    [nodeType: string]: {
        enter?: (node: Node, parent: Node | null) => void;
        exit?: (node: Node, parent: Node | null) => void;
    } | ((node: Node, parent: Node | null) => void) | undefined;
    enter?: (node: Node, parent: Node | null) => void;
    exit?: (node: Node, parent: Node | null) => void;
}

export type TransformerPlugin = (context: TransformationContext) => Visitor;

// 主要配置接口
export interface MinifyOptions {
    compress?: CompressOptions;
    mangle?: MangleOptions;
    output?: GeneratorOptions;
    sourceMap?: boolean;
    ecma?: number;
}

export interface CompressOptions {
    constantFolding?: boolean;
    deadCodeElimination?: boolean;
    booleanOptimization?: boolean;
    sequenceOptimization?: boolean;
    dropConsole?: boolean;
    dropDebugger?: boolean;
}

export interface MangleOptions {
    enabled?: boolean;
    reservedNames?: string[];
    keepClassNames?: boolean;
    keepFunctionNames?: boolean;
}

// 作用域管理相关接口
export interface Binding {
    name: string;
    declaration: Node;
    references: Node[];
    reassigned: boolean;
    isConstant: boolean;
    mangledName: string | null;
}

export interface Scope {
    id: number;
    parent: Scope | null;
    bindings: Map<string, Binding>;
    children: Scope[];
    type: 'global' | 'function' | 'block' | 'class';
    node: Node | null;
    findDefiningScope(name: string): Scope | null;
    addBinding(name: string, declarationNode: Node): void;
    addReference(name: string, referenceNode: Node): void;
    markReassigned(name: string): void;
}

export interface ScopeManager {
    globalScope: Scope;
    scopes: Scope[];
    scopeStack: Scope[];
    currentScope: Scope;
    analyze(ast: Node): void;
    createScope(type: Scope['type'], node: Node | null): Scope;
    enterScope(scope: Scope): void;
    exitScope(): void;
    addBinding(name: string, declarationNode: Node): void;
    findDefiningScope(name: string): Scope | null;
}

// 结果接口
export interface MinifyResult {
    code: string;
    map?: any;
    warnings?: string[];
}
