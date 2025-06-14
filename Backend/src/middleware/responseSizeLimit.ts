import { Request, Response, NextFunction } from "express";

// Extend the Response interface to properly type the original send method
interface ResponseWithOriginalSend extends Response {
  originalSend?: Response['send'];
}

export const responseSizeLimit = (maxSizeBytes: number = 16 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const extendedRes = res as ResponseWithOriginalSend;
    
    // Store the original send method if not already stored
    if (!extendedRes.originalSend) {
      extendedRes.originalSend = res.send.bind(res);
    }
    
    // Override the send method
    res.send = function(this: Response, data: any): Response {
      try {
        // Calculate size of the response
        let size: number;
        if (typeof data === 'string') {
          size = Buffer.byteLength(data, 'utf8');
        } else if (Buffer.isBuffer(data)) {
          size = data.length;
        } else {
          // For objects, stringify to calculate size
          size = Buffer.byteLength(JSON.stringify(data), 'utf8');
        }
        
        // Check if size exceeds limit
        if (size > maxSizeBytes) {
          console.warn(`Response size (${size} bytes) exceeds limit (${maxSizeBytes} bytes) for ${req.method} ${req.path}`);
          
          // Return error response instead of the large data
          return this.status(413).json({
            status: "error",
            message: "Response too large",
            details: {
              size: size,
              limit: maxSizeBytes,
              path: req.path
            }
          });
        }
        
        // If size is acceptable, call the original send method
        return extendedRes.originalSend!.call(this, data);
        
      } catch (error) {
        console.error('Error in responseSizeLimit middleware:', error);
        // If there's an error calculating size, proceed with original send
        return extendedRes.originalSend!.call(this, data);
      }
    } as Response['send'];
    
    next();
  };
};