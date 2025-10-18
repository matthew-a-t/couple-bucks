import { supabase } from '@/lib/supabase'

/**
 * Storage Service
 * Handles file uploads to Supabase Storage, primarily for receipt images
 */

const RECEIPTS_BUCKET = 'receipts'

export const storageService = {
  /**
   * Upload a receipt image
   * Returns the public URL of the uploaded file
   */
  async uploadReceipt(file: File, coupleId: string, expenseId: string): Promise<string> {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${coupleId}/${expenseId}_${Date.now()}.${fileExt}`

    // Upload file
    const { data, error } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(RECEIPTS_BUCKET)
      .getPublicUrl(data.path)

    return urlData.publicUrl
  },

  /**
   * Delete a receipt image
   */
  async deleteReceipt(receiptUrl: string): Promise<void> {
    // Extract path from URL
    const url = new URL(receiptUrl)
    const path = url.pathname.split(`/${RECEIPTS_BUCKET}/`)[1]

    if (!path) {
      throw new Error('Invalid receipt URL')
    }

    const { error } = await supabase.storage.from(RECEIPTS_BUCKET).remove([path])

    if (error) throw error
  },

  /**
   * Update receipt (delete old, upload new)
   */
  async updateReceipt(
    file: File,
    coupleId: string,
    expenseId: string,
    oldReceiptUrl?: string
  ): Promise<string> {
    // Delete old receipt if it exists
    if (oldReceiptUrl) {
      try {
        await this.deleteReceipt(oldReceiptUrl)
      } catch (error) {
        console.error('Failed to delete old receipt:', error)
        // Continue with upload even if delete fails
      }
    }

    // Upload new receipt
    return this.uploadReceipt(file, coupleId, expenseId)
  },

  /**
   * Get signed URL for private receipt (if bucket is private)
   */
  async getSignedReceiptUrl(receiptPath: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .createSignedUrl(receiptPath, expiresIn)

    if (error) throw error
    return data.signedUrl
  },

  /**
   * List all receipts for a couple
   */
  async listCoupleReceipts(coupleId: string): Promise<string[]> {
    const { data, error } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .list(coupleId)

    if (error) throw error

    return data.map((file) => {
      const { data: urlData } = supabase.storage
        .from(RECEIPTS_BUCKET)
        .getPublicUrl(`${coupleId}/${file.name}`)
      return urlData.publicUrl
    })
  },

  /**
   * Delete all receipts for a couple (use with caution)
   */
  async deleteAllCoupleReceipts(coupleId: string): Promise<void> {
    const { data, error: listError } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .list(coupleId)

    if (listError) throw listError

    const filePaths = data.map((file) => `${coupleId}/${file.name}`)

    const { error: deleteError } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .remove(filePaths)

    if (deleteError) throw deleteError
  }
}

/**
 * Helper function to compress image before upload
 * This should be used in the UI layer before calling uploadReceipt
 */
export const compressImage = async (
  file: File,
  _maxSizeMB = 1,
  _maxWidthOrHeight = 1920
): Promise<File> => {
  // This is a placeholder - you would use a library like browser-image-compression
  // For now, just return the file as-is
  // TODO: Implement with browser-image-compression library
  return file
}
