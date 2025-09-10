import { ExportRestaurantLayout } from "../types/restaurant";

export class LayoutImporter {
    static validateAppFormat(data: any): data is ExportRestaurantLayout {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid layout file: File is empty or malformed');
        }

        // Check if it matches our RestaurantLayout structure
        if (typeof data.id !== 'string') {
            throw new Error('Invalid layout file: Missing or invalid id');
        }

        if (typeof data.name !== 'string') {
            throw new Error('Invalid layout file: Missing or invalid name');
        }

        if (!data.floor || typeof data.floor !== 'object') {
            throw new Error('Invalid layout file: Missing floor data');
        }

        // Validate floor structure
        const floor = data.floor;
        if (typeof floor.id !== 'string') {
            throw new Error('Invalid layout file: Floor missing id');
        }
        if (typeof floor.name !== 'string') {
            throw new Error('Invalid layout file: Floor missing name');
        }
        if (typeof floor.width !== 'number' || typeof floor.height !== 'number') {
            throw new Error('Invalid layout file: Floor has invalid dimensions');
        }
        if (typeof floor.isLocked !== 'boolean') {
            throw new Error('Invalid layout file: Floor missing isLocked property');
        }
        if (typeof floor.version !== 'number') {
            throw new Error('Invalid layout file: Floor missing version');
        }
        if (!Array.isArray(floor.layoutItems)) {
            throw new Error('Invalid layout file: Floor layoutItems should be an array');
        }

        // Validate layout items
        floor.layoutItems.forEach((item: any, index: number) => {
            if (typeof item.id !== 'string') {
                throw new Error(`Invalid layout file: Layout item ${index} missing id`);
            }
            if (typeof item.x !== 'number' || typeof item.y !== 'number') {
                throw new Error(`Invalid layout file: Layout item ${index} has invalid position`);
            }
            // Add more validations as needed for your specific item properties
        });

        // Metadata is optional, but if present should be an object
        if (data.metadata !== undefined && (typeof data.metadata !== 'object' || data.metadata === null)) {
            throw new Error('Invalid layout file: Metadata should be an object');
        }

        return true;
    }

    static async readFile(file: File): Promise<ExportRestaurantLayout> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const content = e.target?.result;
                    if (typeof content !== 'string') {
                        throw new Error('Failed to read file content');
                    }

                    const data = JSON.parse(content);
                    this.validateAppFormat(data);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }
}