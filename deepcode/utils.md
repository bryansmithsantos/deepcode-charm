# DeepCode Utilities

This document describes the utility functions and helper tools available in DeepCode.

## Schema Utilities

Tools for working with validation schemas:

```javascript
// Create schema reference
SchemaUtils.ref('schemaName')

// Merge multiple schemas
SchemaUtils.merge(schema1, schema2)

// Create partial schema
SchemaUtils.partial(schema)

// Pick specific fields
SchemaUtils.pick(schema, ['field1', 'field2'])

// Omit specific fields
SchemaUtils.omit(schema, ['field1', 'field2'])
```

## String Utilities

Common string operations:

```javascript
// Clean string content
string.clean('input') 

// Format with variables
string.format('Hello {name}', { name: 'World' })

// Split into arguments
string.parseArgs('command arg1 "arg 2" arg3')

// Convert to safe filename
string.toSafeFilename('My File Name.txt')
```

## Array Utilities

Array manipulation helpers:

```javascript
// Create chunks
array.chunk([1,2,3,4,5], 2) // [[1,2], [3,4], [5]]

// Get random element
array.random(['a', 'b', 'c'])

// Shuffle array
array.shuffle([1,2,3,4,5])

// Remove duplicates
array.unique([1,2,2,3,3,4])
```

## File Utilities

File system operations:

```javascript
// Read JSON file
file.readJSON('config.json')

// Write JSON file
file.writeJSON('data.json', data)

// Check if exists
file.exists('path/to/file')

// Create directory
file.mkdir('path/to/dir')
```

## Path Utilities

Path manipulation helpers:

```javascript
// Join paths
path.join('dir', 'file.txt')

// Get filename
path.filename('/path/to/file.txt')

// Get extension
path.extension('file.txt')

// Make relative
path.relative(from, to)
```

## Time Utilities

Time and date helpers:

```javascript
// Format duration
time.format(3600000) // "1 hour"

// Parse duration
time.parse('2h 30m')

// Add duration
time.add(date, '1d')

// Format timestamp
time.timestamp(date)
```

## Color Utilities

Color manipulation tools:

```javascript
// RGB to hex
color.toHex(255, 128, 0)

// Hex to RGB
color.toRGB('#FF8000')

// Random color
color.random()

// Blend colors
color.blend(color1, color2, 0.5)
```

## Debug Utilities

Debugging helpers:

```javascript
// Log with level
debug.log('message', 'info')

// Start timer
debug.time('operation')

// End timer
debug.timeEnd('operation')

// Stack trace
debug.trace()
```

## Validation Utilities

Input validation helpers:

```javascript
// Check type
validate.type(value, 'string')

// Match pattern
validate.pattern(value, /regex/)

// Check range
validate.range(value, min, max)

// Custom validation
validate.custom(value, fn)
```

## Format Utilities

Data formatting tools:

```javascript
// Pretty print JSON
format.json(data)

// Format code
format.code(source)

// Format table
format.table(data)

// Format list
format.list(items)
```

## Math Utilities

Mathematical operations:

```javascript
// Random integer
math.random(1, 10)

// Round to decimal places
math.round(1.234, 2)

// Clamp value
math.clamp(value, min, max)

// Lerp
math.lerp(start, end, t)
```

For more information about each utility, check the API documentation or source code.
