/**
 * Audit Trail System
 * 
 * Compliance-ready audit logging for verification operations
 * 
 * @module logging/audit
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

/**
 * Audit entry structure
 */
export interface AuditEntry {
  timestamp: string;
  requestId: string;
  operation: 'verify' | 'classify' | 'check-input' | 'check-pii' | 'plugin-execute';
  input: {
    contentLength: number;
    contentHash: string;
    hasPrompt: boolean;
  };
  output: {
    riskLevel: string;
    findingsCount: number;
    blocked: boolean;
  };
  metadata: {
    version: string;
    duration: number;
    enginesUsed: string[];
    configTier: string;
  };
  user?: {
    id?: string;
    ip?: string;
  };
}

/**
 * Audit configuration
 */
export interface AuditConfig {
  enabled: boolean;
  auditDir?: string;
  includeContentHash?: boolean;
  includeUserInfo?: boolean;
  maxFileSize?: number;
  maxFiles?: number;
}

/**
 * Default audit configuration
 */
const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  enabled: true,
  auditDir: path.join(os.homedir(), '.llmverify', 'audit'),
  includeContentHash: true,
  includeUserInfo: false,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 50 // Keep more audit files
};

/**
 * Audit logger class
 */
export class AuditLogger {
  private config: AuditConfig;
  
  constructor(config?: Partial<AuditConfig>) {
    this.config = { ...DEFAULT_AUDIT_CONFIG, ...config };
    this.ensureAuditDirectory();
  }
  
  /**
   * Ensure audit directory exists
   */
  private ensureAuditDirectory(): void {
    if (this.config.enabled && this.config.auditDir) {
      try {
        fs.mkdirSync(this.config.auditDir, { recursive: true });
      } catch (error) {
        console.error('Failed to create audit directory:', error);
        this.config.enabled = false;
      }
    }
  }
  
  /**
   * Get audit file path
   */
  private getAuditFilePath(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.config.auditDir!, `audit-${date}.jsonl`);
  }
  
  /**
   * Generate content hash
   */
  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }
  
  /**
   * Write audit entry
   */
  public log(entry: Omit<AuditEntry, 'timestamp'>): void {
    if (!this.config.enabled) return;
    
    try {
      const fullEntry: AuditEntry = {
        timestamp: new Date().toISOString(),
        ...entry
      };
      
      const auditFile = this.getAuditFilePath();
      const line = JSON.stringify(fullEntry) + '\n';
      
      fs.appendFileSync(auditFile, line, 'utf-8');
      
      // Rotate if needed
      this.rotateIfNeeded(auditFile);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to write audit entry:', error);
      }
    }
  }
  
  /**
   * Log verification operation
   */
  public logVerification(params: {
    requestId: string;
    content: string;
    prompt?: string;
    riskLevel: string;
    findingsCount: number;
    blocked: boolean;
    duration: number;
    enginesUsed: string[];
    configTier: string;
    userId?: string;
    userIp?: string;
  }): void {
    this.log({
      requestId: params.requestId,
      operation: 'verify',
      input: {
        contentLength: params.content.length,
        contentHash: this.config.includeContentHash ? this.hashContent(params.content) : '',
        hasPrompt: !!params.prompt
      },
      output: {
        riskLevel: params.riskLevel,
        findingsCount: params.findingsCount,
        blocked: params.blocked
      },
      metadata: {
        version: require('../../package.json').version,
        duration: params.duration,
        enginesUsed: params.enginesUsed,
        configTier: params.configTier
      },
      user: this.config.includeUserInfo ? {
        id: params.userId,
        ip: params.userIp
      } : undefined
    });
  }
  
  /**
   * Rotate audit files
   */
  private rotateIfNeeded(auditFile: string): void {
    try {
      const stats = fs.statSync(auditFile);
      
      if (stats.size > this.config.maxFileSize!) {
        const timestamp = Date.now();
        const rotatedFile = auditFile.replace('.jsonl', `.${timestamp}.jsonl`);
        fs.renameSync(auditFile, rotatedFile);
        
        this.cleanupOldAudits();
      }
    } catch (error) {
      // Ignore rotation errors
    }
  }
  
  /**
   * Clean up old audit files
   */
  private cleanupOldAudits(): void {
    if (!this.config.auditDir) return;
    
    try {
      const files = fs.readdirSync(this.config.auditDir)
        .filter(f => f.startsWith('audit-') && f.endsWith('.jsonl'))
        .map(f => ({
          name: f,
          path: path.join(this.config.auditDir!, f),
          time: fs.statSync(path.join(this.config.auditDir!, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);
      
      if (files.length > this.config.maxFiles!) {
        files.slice(this.config.maxFiles!).forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            // Ignore deletion errors
          }
        });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
  
  /**
   * Read audit entries
   */
  public readAudit(date?: string): AuditEntry[] {
    if (!this.config.auditDir) return [];
    
    const dateStr = date || new Date().toISOString().split('T')[0];
    const auditFile = path.join(this.config.auditDir, `audit-${dateStr}.jsonl`);
    
    if (!fs.existsSync(auditFile)) return [];
    
    try {
      const content = fs.readFileSync(auditFile, 'utf-8');
      return content
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line) as AuditEntry);
    } catch (error) {
      console.error('Failed to read audit:', error);
      return [];
    }
  }
  
  /**
   * Get audit statistics
   */
  public getStats(date?: string): {
    totalOperations: number;
    byOperation: Record<string, number>;
    blockedCount: number;
    avgDuration: number;
    riskDistribution: Record<string, number>;
  } {
    const entries = this.readAudit(date);
    
    const stats = {
      totalOperations: entries.length,
      byOperation: {} as Record<string, number>,
      blockedCount: 0,
      avgDuration: 0,
      riskDistribution: {} as Record<string, number>
    };
    
    let totalDuration = 0;
    
    entries.forEach(entry => {
      // Count by operation
      stats.byOperation[entry.operation] = (stats.byOperation[entry.operation] || 0) + 1;
      
      // Count blocked
      if (entry.output.blocked) stats.blockedCount++;
      
      // Sum duration
      totalDuration += entry.metadata.duration;
      
      // Risk distribution
      const risk = entry.output.riskLevel;
      stats.riskDistribution[risk] = (stats.riskDistribution[risk] || 0) + 1;
    });
    
    if (entries.length > 0) {
      stats.avgDuration = totalDuration / entries.length;
    }
    
    return stats;
  }
  
  /**
   * Export audit trail for compliance
   */
  public exportAuditTrail(startDate: string, endDate: string, outputPath: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allEntries: AuditEntry[] = [];
    
    // Collect all entries in date range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const entries = this.readAudit(dateStr);
      allEntries.push(...entries);
    }
    
    // Write to output file
    const report = {
      exportDate: new Date().toISOString(),
      dateRange: { start: startDate, end: endDate },
      totalEntries: allEntries.length,
      entries: allEntries
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  }
}

/**
 * Global audit logger
 */
let globalAuditLogger: AuditLogger | null = null;

/**
 * Get global audit logger
 */
export function getAuditLogger(config?: Partial<AuditConfig>): AuditLogger {
  if (!globalAuditLogger) {
    globalAuditLogger = new AuditLogger(config);
  }
  return globalAuditLogger;
}

/**
 * Set global audit logger
 */
export function setAuditLogger(logger: AuditLogger): void {
  globalAuditLogger = logger;
}
