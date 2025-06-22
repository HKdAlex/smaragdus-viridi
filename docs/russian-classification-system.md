# Russian Gemstone Classification System

## Overview

The import system now includes intelligent gemstone type and color detection based on the Russian folder naming conventions used in the collection.

## Classification Rules

### Folder Name → Gemstone Type Mapping

| Folder Code                | Gemstone Type | Russian Name         | Notes                                               |
| -------------------------- | ------------- | -------------------- | --------------------------------------------------- |
| Numbers only (1, 1.1, 1.2) | Emerald       | изумруды             | Default for numeric folders                         |
| А + numbers                | Emerald       | изумруды             |                                                     |
| Б + numbers                | Emerald       | бразильские изумруды | Brazilian emeralds (lower segment)                  |
| Г + numbers                | Garnet        | гранаты              |                                                     |
| Е + numbers                | Emerald       | изумруды             |                                                     |
| К + numbers                | Quartz        | зелёные камни/кварц  | Green stones/low quality emerald cabochons + quartz |
| Л + numbers                | Tourmaline    | турмалины            | Currently one stone, may expand later               |
| М + numbers                | Morganite     | морганиты            |                                                     |
| Н + numbers                | Aquamarine    | аквамарины           |                                                     |
| П + numbers                | Peridot       | перидоты             |                                                     |
| Р + numbers                | Zircon        | цирконы              |                                                     |
| С + numbers                | Sapphire      | сапфиры              |                                                     |
| Т + numbers                | Apatite       | апатиты              |                                                     |
| Ф + numbers                | Amethyst      | аметисты             |                                                     |
| Ц + numbers                | Citrine       | цитрины              |                                                     |
| Z + numbers                | Tanzanite     | танзаниты            |                                                     |

## Intelligent Color Detection

The system automatically assigns appropriate colors based on gemstone type:

| Gemstone Type | Assigned Color | Database Enum |
| ------------- | -------------- | ------------- |
| Emerald       | Green          | `green`       |
| Aquamarine    | Blue           | `blue`        |
| Morganite     | Pink           | `pink`        |
| Garnet        | Red            | `red`         |
| Peridot       | Green          | `green`       |
| Sapphire      | Blue           | `blue`        |
| Amethyst      | Colorless      | `colorless`   |
| Citrine       | Yellow         | `yellow`      |
| Tanzanite     | Fancy Blue     | `fancy-blue`  |
| Tourmaline    | Green          | `green`       |
| Zircon        | Colorless      | `colorless`   |
| Apatite       | Blue           | `blue`        |
| Quartz        | Colorless      | `colorless`   |

## Database Updates

Added new gemstone types to the `gemstone_type` enum:

- `aquamarine`
- `morganite`
- `tourmaline`
- `zircon`
- `apatite`
- `quartz`

## Implementation

The detection functions are implemented in `scripts/gemstone-import-system-v2.mjs`:

```javascript
function detectGemstoneType(folderName) {
  const firstChar = folderName.charAt(0).toUpperCase();
  return GEMSTONE_TYPE_MAP[firstChar] || GEMSTONE_TYPE_MAP.default;
}

function detectGemstoneColor(gemstoneType) {
  const colorMap = {
    emerald: "green",
    aquamarine: "blue",
    morganite: "pink",
    // ... full mapping
  };
  return colorMap[gemstoneType] || "colorless";
}
```

## Benefits

1. **Automatic Classification**: No manual gemstone type entry required
2. **Accurate Colors**: Realistic color assignments based on gemstone properties
3. **Russian Collection Support**: Native support for the existing folder structure
4. **Extensible**: Easy to add new classifications as the collection grows
5. **Database Consistency**: All gemstone types properly defined in database enums

## Usage

The classification happens automatically during import. The console output now shows:

```
💎 Created gemstone: SV-А15-612345 (emerald, green)
💎 Created gemstone: SV-Н22-612346 (aquamarine, blue)
💎 Created gemstone: SV-Ц8-612347 (citrine, yellow)
```

This ensures that each imported gemstone has the correct type and color based on your established classification system.
