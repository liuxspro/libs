pub fn decrypt_data_impl(encrypted_data: &[u8], key: &[u8]) -> Result<Vec<u8>, &'static str> {
    if key.len() != 1024 {
        return Err("Key length must be 1024 bytes");
    }
    let mut decrypted = Vec::with_capacity(encrypted_data.len());
    let mut key_index: usize = 16; // 从密钥的第16个字节开始

    for &encrypted_byte in encrypted_data {
        // 计算实际密钥索引，确保不越界
        let actual_key_index = key_index + 8;
        if actual_key_index >= key.len() {
            return Err("Key index out of bounds");
        }

        // 异或解密
        let decrypted_byte = encrypted_byte ^ key[actual_key_index];
        decrypted.push(decrypted_byte);

        // 更新密钥索引
        key_index += 1;

        // 如果key_index是8的倍数，则增加16
        if key_index % 8 == 0 {
            key_index += 16;
        }

        // 如果key_index超过1016，则调整
        if key_index >= 1016 {
            key_index = (key_index + 8) % 24;
        }
    }

    Ok(decrypted)
}

pub fn decrypt_data_with_default_key(encrypted_data: &[u8]) -> Vec<u8> {
    let key: &[u8] = include_bytes!("key.bin");
    decrypt_data_impl(encrypted_data, key).expect("error in decrypt data")
}

pub fn decrypt_data(data: &[u8], key: Option<&[u8]>) -> Result<Vec<u8>, &'static str> {
    let key_slice = match key {
        Some(k) => k,
        None => include_bytes!("key.bin"),
    };
    return decrypt_data_impl(data, key_slice);
}
