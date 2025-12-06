// 确保上传函数正确调用
async function uploadLevels() {
  try {
    const response = await fetch('/api/levels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ levels: currentLevels }),
    });

    const result = await response.json();
    if (result.success) {
      console.log('关卡上传成功');
    } else {
      console.error('关卡上传失败:', result.error);
    }
  } catch (error) {
    console.error('上传过程中发生错误:', error);
  }
}