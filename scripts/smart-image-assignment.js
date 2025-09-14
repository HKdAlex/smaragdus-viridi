#!/usr/bin/env node

/**
 * Smart Image Assignment Script for Crystallique
 * Assigns appropriate images based on gemstone properties and eliminates duplicates
 */

const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Curated gemstone images matched to properties
const GEMSTONE_IMAGE_LIBRARY = {
  // Diamonds - colorless/white stones
  diamond: {
    colorless: {
      round:
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80", // Classic round diamond
      princess:
        "https://images.unsplash.com/photo-1522199710521-72d69614c702?w=800&auto=format&fit=crop&q=80", // Square princess cut
      emerald:
        "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800&auto=format&fit=crop&q=80", // Emerald cut diamond
      cushion:
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80", // Cushion cut
      default:
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    },
    "fancy-yellow": {
      default:
        "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&auto=format&fit=crop&q=80", // Yellow gemstone
    },
    "fancy-blue": {
      default:
        "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80", // Blue gemstone
    },
    "fancy-pink": {
      default:
        "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&auto=format&fit=crop&q=80", // Pink/rose gemstone
    },
  },

  // Emeralds - green stones
  emerald: {
    green: {
      emerald:
        "https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=800&auto=format&fit=crop&q=80", // Green emerald cut
      oval: "https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=800&auto=format&fit=crop&q=80", // Green oval
      default:
        "https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=800&auto=format&fit=crop&q=80",
    },
  },

  // Rubies - red stones
  ruby: {
    red: {
      oval: "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&auto=format&fit=crop&q=80", // Red oval
      round:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=80", // Red round
      cushion:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=80", // Red cushion
      default:
        "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&auto=format&fit=crop&q=80",
    },
  },

  // Sapphires - various colors
  sapphire: {
    blue: {
      round:
        "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80", // Blue round
      oval: "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80", // Blue oval
      princess:
        "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80", // Blue princess
      cushion:
        "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80", // Blue cushion
      default:
        "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
    },
    yellow: {
      default:
        "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&auto=format&fit=crop&q=80", // Yellow sapphire
    },
    pink: {
      default:
        "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&auto=format&fit=crop&q=80", // Pink sapphire
    },
    white: {
      default:
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80", // White/colorless
    },
  },

  // Other gemstones
  amethyst: {
    pink: {
      default:
        "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&auto=format&fit=crop&q=80", // Pink amethyst
    },
  },

  topaz: {
    blue: {
      default:
        "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80", // Blue topaz
    },
  },

  garnet: {
    red: {
      default:
        "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&auto=format&fit=crop&q=80", // Red garnet
    },
  },

  peridot: {
    green: {
      default:
        "https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=800&auto=format&fit=crop&q=80", // Green peridot
    },
  },

  citrine: {
    yellow: {
      default:
        "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&auto=format&fit=crop&q=80", // Yellow citrine
    },
  },

  tanzanite: {
    blue: {
      oval: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop&q=80", // Blue tanzanite - unique
      emerald:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop&q=80", // Blue tanzanite
      cushion:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop&q=80", // Blue tanzanite
      default:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop&q=80",
    },
  },
};

/**
 * Get the best matching image for a gemstone
 */
function getBestImage(gemstoneType, color, cut) {
  const typeLibrary = GEMSTONE_IMAGE_LIBRARY[gemstoneType.toLowerCase()];
  if (!typeLibrary) {
    // Fallback to generic diamond image
    return "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80";
  }

  // Handle diamond color grades (D, E, F, G, H, I, J)
  let colorKey = color.toLowerCase();
  if (
    gemstoneType.toLowerCase() === "diamond" &&
    ["d", "e", "f", "g", "h", "i", "j"].includes(colorKey)
  ) {
    colorKey = "colorless";
  }

  const colorLibrary = typeLibrary[colorKey];
  if (!colorLibrary) {
    // Try to find any color for this gemstone type
    const firstColor = Object.keys(typeLibrary)[0];
    const fallbackLibrary = typeLibrary[firstColor];
    return (
      fallbackLibrary.default ||
      fallbackLibrary[Object.keys(fallbackLibrary)[0]]
    );
  }

  // Try to match exact cut
  const cutKey = cut.toLowerCase();
  if (colorLibrary[cutKey]) {
    return colorLibrary[cutKey];
  }

  // Use default for this color
  if (colorLibrary.default) {
    return colorLibrary.default;
  }

  // Use first available cut for this color
  const firstCut = Object.keys(colorLibrary)[0];
  return colorLibrary[firstCut];
}

/**
 * Assign smart images to all gemstones
 */
async function assignSmartImages() {
  console.log("🎨 Starting smart image assignment for Crystallique\n");

  try {
    // Get all gemstones
    const { data: gemstones, error: gemstonesError } = await supabase
      .from("gemstones")
      .select("id, name, color, cut, serial_number")
      .order("name, color, cut");

    if (gemstonesError) throw gemstonesError;

    console.log(`📊 Found ${gemstones.length} gemstones to process\n`);

    let assignmentCount = 0;
    let changedCount = 0;

    for (const gemstone of gemstones) {
      const optimalImage = getBestImage(
        gemstone.name,
        gemstone.color,
        gemstone.cut
      );

      // Get current images for this gemstone
      const { data: currentImages } = await supabase
        .from("gemstone_images")
        .select("id, image_url")
        .eq("gemstone_id", gemstone.id);

      // Check if we need to update
      const needsUpdate =
        !currentImages ||
        currentImages.length !== 1 ||
        currentImages[0].image_url !== optimalImage;

      if (needsUpdate) {
        // Delete all existing images for this gemstone
        if (currentImages && currentImages.length > 0) {
          await supabase
            .from("gemstone_images")
            .delete()
            .eq("gemstone_id", gemstone.id);
        }

        // Insert the optimal image
        const { error: insertError } = await supabase
          .from("gemstone_images")
          .insert({
            gemstone_id: gemstone.id,
            image_url: optimalImage,
            image_order: 1,
            is_primary: true,
            has_watermark: true,
          });

        if (insertError) {
          console.error(
            `❌ Failed to assign image for ${gemstone.serial_number}:`,
            insertError
          );
          continue;
        }

        console.log(
          `✅ ${gemstone.serial_number}: ${gemstone.color} ${gemstone.name} (${gemstone.cut}) → Optimal image assigned`
        );
        changedCount++;
      } else {
        console.log(`✓ ${gemstone.serial_number}: Already has optimal image`);
      }

      assignmentCount++;
    }

    console.log(`\n📊 Smart Image Assignment Results:`);
    console.log(`✅ Processed: ${assignmentCount} gemstones`);
    console.log(`🔄 Updated: ${changedCount} gemstones`);
    console.log(
      `👍 Optimal: ${assignmentCount - changedCount} already correct`
    );

    // Show final image distribution
    const { data: finalImages } = await supabase
      .from("gemstone_images")
      .select("image_url")
      .order("image_url");

    if (finalImages) {
      const uniqueImages = [
        ...new Set(finalImages.map((img) => img.image_url)),
      ];
      console.log(`\n🖼️  Final Image Distribution:`);
      console.log(`📸 Unique images: ${uniqueImages.length}`);
      console.log(`📋 Total assignments: ${finalImages.length}`);
      console.log(
        `🎯 No duplicates: ${
          finalImages.length === gemstones.length ? "✅" : "❌"
        }`
      );
    }

    console.log("\n🎉 Smart image assignment completed!");
  } catch (error) {
    console.error("❌ Smart image assignment failed:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  assignSmartImages();
}

module.exports = { assignSmartImages, getBestImage };
