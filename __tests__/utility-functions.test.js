import log from 'N/log';
import format from 'N/format';

jest.mock('N/log');
jest.mock('N/format');

describe('NetSuite Utility Functions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Data Validation Functions', () => {
        it('should validate email addresses correctly', () => {
            const validateEmail = (email) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            };

            expect(validateEmail('test@example.com')).toBe(true);
            expect(validateEmail('user.name+label@domain.co.uk')).toBe(true);
            expect(validateEmail('invalid.email')).toBe(false);
            expect(validateEmail('invalid@')).toBe(false);
            expect(validateEmail('@invalid.com')).toBe(false);
            expect(validateEmail('')).toBe(false);
        });

        it('should validate phone numbers', () => {
            const validatePhoneNumber = (phone) => {
                // Remove all non-digit characters
                const cleanPhone = phone.replace(/\D/g, '');
                
                // Check if it's a valid length (10-15 digits)
                return cleanPhone.length >= 10 && cleanPhone.length <= 15;
            };

            expect(validatePhoneNumber('(555) 123-4567')).toBe(true);
            expect(validatePhoneNumber('555-123-4567')).toBe(true);
            expect(validatePhoneNumber('5551234567')).toBe(true);
            expect(validatePhoneNumber('+1 555 123 4567')).toBe(true);
            expect(validatePhoneNumber('555-123-456')).toBe(false); // too short
            expect(validatePhoneNumber('abc-def-ghij')).toBe(false); // no digits
        });

        it('should validate tax ID numbers', () => {
            const validateTaxId = (taxId) => {
                // Remove all non-alphanumeric characters
                const cleanTaxId = taxId.replace(/[^a-zA-Z0-9]/g, '');
                
                // Check basic format (simplified validation)
                return cleanTaxId.length >= 9 && cleanTaxId.length <= 11;
            };

            expect(validateTaxId('12-3456789')).toBe(true);
            expect(validateTaxId('123456789')).toBe(true);
            expect(validateTaxId('12345678')).toBe(false); // too short
            expect(validateTaxId('')).toBe(false);
        });
    });

    describe('Data Formatting Functions', () => {
        it('should format currency values', () => {
            const formatCurrency = (amount, currencyCode = 'USD') => {
                const numAmount = parseFloat(amount);
                if (isNaN(numAmount)) return '$0.00';
                
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currencyCode
                }).format(numAmount);
            };

            expect(formatCurrency(1234.56)).toBe('$1,234.56');
            expect(formatCurrency('1234.56')).toBe('$1,234.56');
            expect(formatCurrency(0)).toBe('$0.00');
            expect(formatCurrency('invalid')).toBe('$0.00');
        });

        it('should format dates consistently', () => {
            // Mock NetSuite format module
            format.format.mockImplementation(({ value, type }) => {
                if (type === 'date') {
                    return value.toLocaleDateString('en-US');
                }
                return value;
            });

            const formatDate = (dateValue) => {
                if (!dateValue) return '';
                
                const date = new Date(dateValue);
                if (isNaN(date.getTime())) return '';
                
                return format.format({
                    value: date,
                    type: format.Type.DATE
                });
            };

            const testDate = new Date('2024-03-15');
            formatDate(testDate);

            expect(format.format).toHaveBeenCalledWith({
                value: testDate,
                type: format.Type.DATE
            });
        });

        it('should clean and format text fields', () => {
            const cleanText = (text, maxLength = 255) => {
                if (!text) return '';
                
                // Remove extra whitespace and trim
                let cleaned = text.replace(/\s+/g, ' ').trim();
                
                // Truncate if too long
                if (cleaned.length > maxLength) {
                    cleaned = cleaned.substring(0, maxLength).trim();
                }
                
                return cleaned;
            };

            expect(cleanText('  Hello    World  ')).toBe('Hello World');
            expect(cleanText('Test', 2)).toBe('Te');
            expect(cleanText('')).toBe('');
            expect(cleanText(null)).toBe('');
        });
    });

    describe('Error Handling Functions', () => {
        it('should handle and log errors gracefully', () => {
            const handleError = (error, context = '') => {
                const errorMessage = error.message || 'Unknown error occurred';
                const errorDetails = {
                    message: errorMessage,
                    context: context,
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                };

                log.error({
                    title: 'Script Error',
                    details: JSON.stringify(errorDetails)
                });

                return {
                    success: false,
                    error: errorMessage,
                    timestamp: errorDetails.timestamp
                };
            };

            const testError = new Error('Test error message');
            const result = handleError(testError, 'Unit Test Context');

            expect(log.error).toHaveBeenCalledWith({
                title: 'Script Error',
                details: expect.stringContaining('Test error message')
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Test error message');
            expect(result.timestamp).toBeDefined();
        });

        it('should retry failed operations', async () => {
            const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
                let lastError;
                
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        const result = await operation();
                        
                        if (attempt > 1) {
                            log.debug({
                                title: 'Operation Succeeded After Retry',
                                details: `Succeeded on attempt ${attempt}`
                            });
                        }
                        
                        return result;
                    } catch (error) {
                        lastError = error;
                        
                        log.debug({
                            title: 'Operation Failed - Attempt ' + attempt,
                            details: error.message
                        });
                        
                        if (attempt < maxRetries) {
                            // In a real scenario, you'd wait here
                            // await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    }
                }
                
                throw lastError;
            };

            // Mock operation that fails twice then succeeds
            let attemptCount = 0;
            const mockOperation = jest.fn().mockImplementation(() => {
                attemptCount++;
                if (attemptCount <= 2) {
                    throw new Error(`Attempt ${attemptCount} failed`);
                }
                return 'Success';
            });

            const result = await retryOperation(mockOperation);

            expect(result).toBe('Success');
            expect(mockOperation).toHaveBeenCalledTimes(3);
            expect(log.debug).toHaveBeenCalledTimes(3); // 2 failures + 1 success after retry
        });
    });

    describe('Business Logic Helpers', () => {
        it('should calculate tax amounts correctly', () => {
            const calculateTax = (amount, taxRate) => {
                const numAmount = parseFloat(amount);
                const numTaxRate = parseFloat(taxRate);
                
                if (isNaN(numAmount) || isNaN(numTaxRate)) {
                    return 0;
                }
                
                return Math.round((numAmount * numTaxRate) * 100) / 100;
            };

            expect(calculateTax(100, 0.08)).toBe(8.00);
            expect(calculateTax(123.45, 0.0825)).toBe(10.18);
            expect(calculateTax('invalid', 0.08)).toBe(0);
            expect(calculateTax(100, 'invalid')).toBe(0);
        });

        it('should generate reference numbers', () => {
            const generateReferenceNumber = (prefix = 'REF', length = 8) => {
                const timestamp = Date.now().toString();
                const random = Math.random().toString(36).substring(2);
                const combined = timestamp + random;
                const suffix = combined.substring(combined.length - length);
                
                return `${prefix}-${suffix.toUpperCase()}`;
            };

            const ref1 = generateReferenceNumber();
            const ref2 = generateReferenceNumber('ORDER', 10);

            expect(ref1).toMatch(/^REF-[A-Z0-9]{8}$/);
            expect(ref2).toMatch(/^ORDER-[A-Z0-9]{10}$/);
            expect(ref1).not.toBe(ref2);
        });
    });
});