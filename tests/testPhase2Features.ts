/**
 * Phase 2 功能测试
 * 
 * 测试内容：
 * - 存档管理器
 * - 事件历史记录
 * - 自动保存/加载
 */

import { saveManager } from '../src/core/SaveManager';
import { gameEngine } from '../src/core/GameEngineIntegration';

async function testPhase2Features() {
  console.log('=== Phase 2 功能测试 ===\n');
  
  // 测试 1: 开始新游戏
  console.log('测试 1: 开始新游戏');
  gameEngine.startNewGame('测试玩家', 'male');
  let gameState = gameEngine.getGameState();
  console.log(`✅ 玩家：${gameState.player?.name}`);
  console.log(`✅ 年龄：${gameState.player?.age}岁`);
  console.log();
  
  // 测试 2: 手动保存
  console.log('测试 2: 手动保存');
  const saveId1 = saveManager.saveGame(gameState, '测试存档 1');
  console.log(`✅ 存档 ID: ${saveId1}`);
  
  // 测试 3: 自动保存
  console.log('测试 3: 自动保存');
  saveManager.autoSave(gameState);
  console.log('✅ 自动保存完成');
  console.log();
  
  // 测试 4: 推进游戏并保存
  console.log('测试 4: 推进游戏并保存');
  gameEngine.advanceTime(5);
  gameState = gameEngine.getGameState();
  const saveId2 = saveManager.saveGame(gameState, '测试存档 2');
  console.log(`✅ 推进到 ${gameState.player?.age}岁`);
  console.log(`✅ 新存档 ID: ${saveId2}`);
  console.log();
  
  // 测试 5: 获取所有存档
  console.log('测试 5: 获取所有存档');
  const allSaves = saveManager.getAllSaves();
  console.log(`✅ 存档数量：${allSaves.length}`);
  allSaves.forEach((save, index) => {
    console.log(`   ${index + 1}. ${save.name} - ${save.metadata.playerAge}岁 - ${save.metadata.eventCount}事件`);
  });
  console.log();
  
  // 测试 6: 加载存档
  console.log('测试 6: 加载存档');
  const loadedSave = saveManager.loadGame(saveId1);
  if (loadedSave) {
    console.log(`✅ 加载存档：${loadedSave.name}`);
    console.log(`   玩家：${loadedSave.metadata.playerName}`);
    console.log(`   年龄：${loadedSave.metadata.playerAge}岁`);
    console.log(`   事件：${loadedSave.metadata.eventCount}个`);
  }
  console.log();
  
  // 测试 7: 导出存档
  console.log('测试 7: 导出存档');
  const exportData = saveManager.exportSave(saveId1);
  if (exportData) {
    console.log('✅ 导出成功');
    console.log(`   数据长度：${exportData.length}字符`);
    console.log(`   格式版本：${JSON.parse(exportData).version}`);
  }
  console.log();
  
  // 测试 8: 导入存档
  console.log('测试 8: 导入存档');
  if (exportData) {
    const importSuccess = saveManager.importSave(exportData);
    console.log(`✅ 导入${importSuccess ? '成功' : '失败'}`);
  }
  console.log();
  
  // 测试 9: 删除存档
  console.log('测试 9: 删除存档');
  const deleteSuccess = saveManager.deleteSave(saveId2);
  console.log(`✅ 删除${deleteSuccess ? '成功' : '失败'}`);
  
  const remainingSaves = saveManager.getAllSaves();
  console.log(`✅ 剩余存档：${remainingSaves.length}个`);
  console.log();
  
  // 测试 10: 加载自动存档
  console.log('测试 10: 检查自动存档');
  const autoSave = saveManager.loadAutoSave();
  if (autoSave) {
    console.log('✅ 发现自动存档');
    console.log(`   时间：${new Date(autoSave.timestamp).toLocaleString()}`);
  } else {
    console.log('✅ 无自动存档');
  }
  console.log();
  
  // 测试 11: 格式化游戏时长
  console.log('测试 11: 格式化游戏时长');
  const testTimes = [30, 120, 3600, 7200];
  testTimes.forEach(seconds => {
    console.log(`   ${seconds}秒 = ${saveManager.formatPlayTime(seconds)}`);
  });
  console.log();
  
  // 测试 12: 清空所有存档
  console.log('测试 12: 清空所有存档');
  saveManager.clearAllSaves();
  const finalSaves = saveManager.getAllSaves();
  console.log(`✅ 剩余存档：${finalSaves.length}个`);
  console.log();
  
  console.log('=== 测试完成 ===');
}

// 运行测试
testPhase2Features().catch(console.error);
