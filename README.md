# Restaurant Layout Builder

A Canva-like drag and drop restaurant table layout builder using Konva.js and Next.js.

## Features

### ✅ Core Features

- **Drag & Drop Interface**: Drag table types from the toolbar onto the canvas
- **Multiple Table Types**: 2-seater, 4-seater, and 6-seater tables with visual representations
- **Table Management**: Select, move, rotate, and delete tables
- **Floor Management**: Create multiple floors and switch between them
- **Table Status**: Mark tables as free, occupied, reserved, or maintenance
- **Table Numbering**: Assign custom table numbers
- **Properties Panel**: Edit table properties including position, rotation, and status
- **Canvas Tools**: Select, Pan, and Rotate tools for different interactions
- **Zoom & Pan**: Mouse wheel zoom and canvas panning
- **Save/Load Layouts**: Export and import restaurant layouts as JSON files

### 🎨 User Interface

- **Left Toolbar**: Tools, table types, floor management, and actions
- **Main Canvas**: Interactive Konva.js canvas with grid background
- **Right Properties Panel**: Table property editor when a table is selected
- **Responsive Design**: Adapts to different screen sizes

### 🏗️ Technical Implementation

- **Next.js 15**: React framework with App Router
- **Konva.js**: 2D canvas library for high-performance graphics
- **React Konva**: React bindings for Konva.js
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Adding Tables

1. Select a table type from the left toolbar (2, 4, or 6 seater)
2. Drag it onto the canvas
3. The table will be placed where you drop it

### Managing Tables

1. **Select Tool**: Click on tables to select them
2. **Move**: Drag selected tables to reposition
3. **Properties**: Edit table properties in the right panel when selected
4. **Delete**: Select a table and press Delete key or use the delete button in properties panel

### Tools

- **Select Tool**: Default tool for selecting and moving tables
- **Pan Tool**: Pan around the canvas by dragging
- **Rotate Tool**: Special rotation mode (future enhancement)

### Floor Management

- **Add Floor**: Click "Add Floor" in the toolbar
- **Switch Floors**: Click on floor names to switch between them
- **Multiple Floors**: Each floor maintains its own set of tables

### Table Status

- **Free** (Green): Available tables
- **Occupied** (Red): Currently occupied tables
- **Reserved** (Yellow): Reserved tables
- **Maintenance** (Gray): Tables under maintenance

### Saving and Loading

- **Save Layout**: Exports the current layout as a JSON file
- **Load Layout**: Import a previously saved layout

## Table Images

The application includes SVG representations of tables:

- 2-seater: Small rectangular table with 2 chairs
- 4-seater: Medium rectangular table with 4 chairs
- 6-seater: Large rectangular table with 6 chairs

You can replace the SVG files in `/public/tables/` with your own PNG images for more realistic representations.

## Keyboard Shortcuts

- **Delete**: Delete selected table
- **Mouse Wheel**: Zoom in/out on canvas

## Future Enhancements

- Custom table shapes and sizes
- Background images for floors
- Table reservation system integration
- Export to PDF/image formats
- Undo/redo functionality
- Table grouping and copying
- Grid snapping
- Measurement tools

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main page
│   ├── layout.tsx            # App layout
│   └── globals.css           # Global styles
├── components/
│   ├── RestaurantLayoutBuilder.tsx  # Main component
│   ├── Toolbar.tsx                  # Left toolbar
│   ├── Canvas.tsx                   # Konva canvas
│   ├── PropertiesPanel.tsx          # Right properties panel
│   └── AddFloorModal.tsx            # Floor creation modal
├── context/
│   └── RestaurantContext.tsx        # State management
├── types/
│   └── restaurant.ts                # TypeScript types
└── utils/
    └── tableConfig.ts               # Table configurations
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
