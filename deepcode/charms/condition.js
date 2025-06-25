/**
 * Condition charm - Control flow and conditionals
 */
module.exports = {
    name: 'condition',
    description: 'Conditional logic execution',
    
    async execute(args, context) {
        const { left, operator, right, then, else: otherwise } = args;

        // Evaluate operands
        const leftValue = this.evaluateValue(left, context);
        const rightValue = this.evaluateValue(right, context);

        // Check condition
        let result = false;
        switch (operator) {
            case '==': result = leftValue == rightValue; break;
            case '===': result = leftValue === rightValue; break;
            case '!=': result = leftValue != rightValue; break;
            case '!==': result = leftValue !== rightValue; break;
            case '>': result = leftValue > rightValue; break;
            case '>=': result = leftValue >= rightValue; break;
            case '<': result = leftValue < rightValue; break;
            case '<=': result = leftValue <= rightValue; break;
            case 'includes': result = String(leftValue).includes(rightValue); break;
            case 'matches': result = new RegExp(rightValue).test(String(leftValue)); break;
            case 'startsWith': result = String(leftValue).startsWith(rightValue); break;
            case 'endsWith': result = String(leftValue).endsWith(rightValue); break;
            case 'typeof': result = typeof leftValue === rightValue; break;
            default: throw new Error('Invalid operator');
        }

        // Execute branch
        if (result) {
            return await context.client.engine.process(then, context);
        } else if (otherwise) {
            return await context.client.engine.process(otherwise, context);
        }
        
        return result;
    },

    /**
     * Evaluate a value which may be a variable reference
     */
    evaluateValue(value, context) {
        if (typeof value !== 'string') return value;
        
        // Check for variable reference
        if (value.startsWith('$$')) {
            const varName = value.slice(2);
            return context.client.variables.get(varName);
        }

        // Return literal value
        return value;
    }
};
