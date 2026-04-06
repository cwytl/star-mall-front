<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElDialog, ElMessageBox } from 'element-plus'
import { Location, Edit, Delete, Plus } from '@element-plus/icons-vue'
import { getUserAddressList, addUserAddress, deleteUserAddress, getUserAddressInfo, updateUserAddress, setDefaultAddress } from '@/api/userAddress'

const router = useRouter()

const addresses = ref([])
const loading = ref(false)
const showAddDialog = ref(false)

// 表单数据
const formData = ref({
  receiverName: '',
  receiverPhone: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',
  area: []
})

// 地区选择器绑定的值
const areaValue = ref([])

// 表单验证
const ruleRef = ref()
const formRef = ref()

// 编辑模式相关
const isEditMode = ref(false)           // 是否编辑模式
const editingAddressId = ref(null)      // 正在编辑的地址ID
const originalFormData = ref({})        // 原始数据副本（用于对比）

// 中国所有省份、自治区、直辖市和特别行政区（省-市-区/县 三级结构）
const areaOptions = ref([
  // 北京市
  {
    code: 'bj',
    name: '北京市',
    children: [
      {
        code: 'bj',
        name: '北京市',
        children: [
          { code: 'dongcheng', name: '东城区' },
          { code: 'xicheng', name: '西城区' },
          { code: 'chaoyang', name: '朝阳区' },
          { code: 'haidian', name: '海淀区' },
          { code: 'fengtai', name: '丰台区' },
          { code: 'shijingshan', name: '石景山区' },
          { code: 'mentougou', name: '门头沟区' },
          { code: 'fangshan', name: '房山区' },
          { code: 'tongzhou', name: '通州区' },
          { code: 'shunyi', name: '顺义区' },
          { code: 'miyun', name: '密云区' },
          { code: 'pinggu', name: '平谷区' },
          { code: 'huairou', name: '怀柔区' },
          { code: 'changping', name: '昌平区' },
          { code: 'daxing', name: '大兴区' },
          { code: 'yizhuang', name: '亦庄地区' }
        ]
      }
    ]
  },
  // 天津市
  {
    code: 'tj',
    name: '天津市',
    children: [
      {
        code: 'tj',
        name: '天津市',
        children: [
          { code: 'heping', name: '和平区' },
          { code: 'hedong', name: '河东区' },
          { code: 'hexi', name: '河西区' },
          { code: 'nankai', name: '南开区' },
          { code: 'hebei', name: '河北区' },
          { code: 'hongqiao', name: '红桥区' },
          { code: 'dongli', name: '东丽区' },
          { code: 'xiqing', name: '西青区' },
          { code: 'beichen', name: '北辰区' },
          { code: 'wuqing', name: '武清区' },
          { code: 'baodi', name: '宝坻区' },
          { code: 'ninghe', name: '宁河区' },
          { code: 'jixian', name: '蓟州区' }
        ]
      }
    ]
  },
  // 上海市
  {
    code: 'sh',
    name: '上海市',
    children: [
      {
        code: 'sh',
        name: '上海市',
        children: [
          { code: 'huangpu', name: '黄浦区' },
          { code: 'xuhui', name: '徐汇区' },
          { code: 'changning', name: '长宁区' },
          { code: 'putuo', name: '普陀区' },
          { code: 'rongkou', name: '虹口区' },
          { code: 'yangpu', name: '杨浦区' },
          { code: 'baoshan', name: '宝山区' },
          { code: 'jiading', name: '嘉定区' },
          { code: 'jingan', name: '静安区' },
          { code: 'minhang', name: '闵行区' },
          { code: 'songjiang', name: '松江区' },
          { code: 'qingpu', name: '青浦区' },
          { code: 'fengxian', name: '奉贤区' },
          { code: 'chongming', name: '崇明区' }
        ]
      }
    ]
  },
  // 重庆市
  {
    code: 'cq',
    name: '重庆市',
    children: [
      {
        code: 'cq',
        name: '重庆市',
        children: [
          { code: 'jiangbei', name: '江北区' },
          { code: 'xiangzhou', name: '南岸区' },
          { code: 'jijiang', name: '九龙坡区' },
          { code: 'yuzhong', name: '渝中区' },
          { code: 'dadukou', name: '大渡口区' },
          { code: 'beibei', name: '北碚区' },
          { code: 'banan', name: '巴南区' },
          { code: 'changshou', name: '长寿区' },
          { code: 'jiangjin', name: '江津区' },
          { code: 'hechuan', name: '合川区' },
          { code: 'yongchuan', name: '永川区' },
          { code: 'zhongxian', name: '忠县' },
          { code: 'kaixian', name: '开州区' },
          { code: 'yunyang', name: '云阳县' },
          { code: 'wujiang', name: '巫山县' },
          { code: 'wushan', name: '巫溪县' },
          { code: 'shizhu', name: '石柱土家族自治县' },
          { code: 'fengdu', name: '丰都县' },
          { code: 'dianjiang', name: '垫江县' },
          { code: 'wulong', name: '武隆区' },
          { code: 'pengshui', name: '彭水苗族土家族自治县' },
          { code: 'qianjiang', name: '黔江区' },
          { code: 'youyang', name: '酉阳土家族苗族自治县' },
          { code: 'tongnan', name: '潼南区' }
        ]
      }
    ]
  },
  // 河北省
  {
    code: 'heb',
    name: '河北省',
    children: [
      {
        code: 'shijiazhuang',
        name: '石家庄市',
        children: [
          { code: 'chang\'an', name: '长安区' },
          { code: 'qiaoxi', name: '桥西区' },
          { code: 'xinhua', name: '新华区' },
          { code: 'luancheng', name: '栾城区' },
          { code: 'xinglong', name: '行唐县' },
          { code: 'lingqiang', name: '灵丘县' },
          { code: 'zhaoxian', name: '赵县' },
          { code: 'gaocheng', name: '藁城区' },
          { code: 'luannan', name: '滦南县' }
        ]
      },
      {
        code: 'tangshan',
        name: '唐山市',
        children: [
          { code: 'lubei', name: '路北区' },
          { code: 'lunan', name: '路南区' },
          { code: 'fengrun', name: '丰润区' },
          { code: 'fengnan', name: '丰南区' },
          { code: 'laoting', name: '滦县' },
          { code: 'yuqian', name: '玉田县' },
          { code: 'fengrun', name: '丰润县' }
        ]
      },
      {
        code: 'qinhuangdao',
        name: '秦皇岛市',
        children: [
          { code: 'haishan', name: '海山区' },
          { code: 'haicheng', name: '海城市' },
          { code: 'sanli', name: '三礼区' },
          { code: 'beidaihe', name: '北戴河区' },
          { code: 'qinangu', name: '秦港区' },
          { code: 'fumin', name: '富民区' }
        ]
      },
      {
        code: 'handan',
        name: '邯郸市',
        children: [
          { code: 'hanan', name: '邯山区' },
          { code: 'handong', name: '复兴区' },
          { code: 'handong', name: '丛台区' },
          { code: 'yongnian', name: '永年区' },
          { code: 'fenyang', name: '肥乡区' },
          { code: 'hanshan', name: '瀚山区' },
          { code: 'weian', name: '魏县' },
          { code: 'yongge', name: '永歌' }
        ]
      },
      {
        code: 'xingtai',
        name: '邢台市',
        children: [
          { code: 'qiaodong', name: '桥东区' },
          { code: 'qiaoxi', name: '桥西区' },
          { code: 'xinfu', name: '新市区' },
          { code: 'nangong', name: '南宫市' },
          { code: 'shahe', name: '沙河市' },
          { code: 'jianping', name: '建平县' },
          { code: 'lincheng', name: '临城县' }
        ]
      },
      {
        code: 'baoding',
        name: '保定市',
        children: [
          { code: 'jingxian', name: '竞秀区' },
          { code: 'baokang', name: '保开发区' },
          { code: 'qingxian', name: '清新区' },
          { code: 'dingxing', name: '定兴县' },
          { code: 'suixian', name: '遂县' },
          { code: 'anxin', name: '安新县' },
          { code: 'beidian', name: '北淀区' },
          { code: 'laishui', name: '涞水县' }
        ]
      },
      {
        code: 'zhangjiakou',
        name: '张家口市',
        children: [
          { code: 'zhanqian', name: '桥西区' },
          { code: 'zhanxian', name: '桥东区' },
          { code: 'yangyuan', name: '阳原县' },
          { code: 'xuanhua', name: '宣化区' },
          { code: 'xiahuayuan', name: '下花园区' },
          { code: 'chongli', name: '崇礼区' },
          { code: 'zhangbei', name: '张北县' }
        ]
      },
      {
        code: 'chengde',
        name: '承德市',
        children: [
          { code: 'shuangqiao', name: '双桥区' },
          { code: 'shuangluan', name: '双滦区' },
          { code: 'chengde', name: '承德县' },
          { code: 'xinglong', name: '兴隆县' },
          { code: 'pingquan', name: '平泉市' },
          { code: 'luquan', name: '隆化县' },
          { code: 'fengning', name: '丰宁满族自治县' }
        ]
      },
      {
        code: 'cangzhou',
        name: '沧州市',
        children: [
          { code: 'cang', name: '沧县' },
          { code: 'dongguang', name: '东光县' },
          { code: 'haihe', name: '海河区' },
          { code: 'huangdao', name: '黄岛区' },
          { code: 'xianxian', name: '献县' },
          { code: 'wuqiang', name: '武强县' },
          { code: 'zhangyan', name: '章丘区' },
          { code: 'jiuding', name: '九鼎区' }
        ]
      },
      {
        code: 'langfang',
        name: '廊坊市',
        children: [
          { code: 'guangyang', name: '广阳区' },
          { code: 'anxin', name: '安新县' },
          { code: 'ydong', name: '育东区' },
          { code: 'baodi', name: '宝坻区' },
          { code: 'wenan', name: '文安县' },
          { code: 'dacheng', name: '大城县' },
          { code: 'guan', name: '馆陶县' },
          { code: 'yongqing', name: '永清县' }
        ]
      },
      {
        code: 'hengshui',
        name: '衡水市',
        children: [
          { code: 'taocheng', name: '桃城区' },
          { code: 'zaoqiang', name: '枣强县' },
          { code: 'wufeng', name: '武邑县' },
          { code: 'zhangji', name: '仉建县' },
          { code: 'jingxian', name: '景县' },
          { code: 'fucheng', name: '阜城县' },
          { code: 'anping', name: '安平县' }
        ]
      }
    ]
  },
  // 山西省
  {
    code: 'sx',
    name: '山西省',
    children: [
      {
        code: 'taiyuan',
        name: '太原市',
        children: [
          { code: 'wanzhai', name: '万柏林区' },
          { code: 'yingze', name: '迎泽区' },
          { code: 'jinyuan', name: '晋源区' },
          { code: 'xiaodian', name: '小店区' },
          { code: 'jiancaoping', name: '尖草坪区' },
          { code: 'yangqu', name: '阳曲县' },
          { code: 'gujiao', name: '古交市' },
          { code: 'qingxu', name: '清徐县' }
        ]
      },
      {
        code: 'datong',
        name: '大同市',
        children: [
          { code: 'chengqu', name: '城城区' },
          { code: 'kouqu', name: '口泉区' },
          { code: 'xinghualing', name: '杏花岭区' },
          { code: 'yanggao', name: '阳高县' },
          { code: 'tianzhen', name: '天镇县' },
          { code: 'guxian', name: '古县' },
          { code: 'lingqiu', name: '灵丘县' }
        ]
      },
      {
        code: 'yangquan',
        name: '阳泉市',
        children: [
          { code: 'chengqu', name: '城区' },
          { code: 'kuangqu', name: '矿区' },
          { code: 'pingding', name: '平定县' },
          { code: 'guan', name: '冠名县' },
          { code: 'zuoquan', name: '左权县' },
          { code: 'heping', name: '和平县' }
        ]
      },
      {
        code: 'changzhi',
        name: '长治市',
        children: [
          { code: 'chengqu', name: '城区' },
          { code: 'chengqu', name: '郊区' },
          { code: 'changzi', name: '长子县' },
          { code: 'wuxiang', name: '武乡县' },
          { code: 'qi', name: '祁县' },
          { code: 'pinglu', name: '平陆县' }
        ]
      },
      {
        code: 'jincheng',
        name: '晋城市',
        children: [
          { code: 'chengqu', name: '城区' },
          { code: 'qinfeng', name: '沁风区' },
          { code: 'lingchuan', name: '陵川县' },
          { code: 'gaoqiao', name: '高桥区' },
          { code: 'zuoquan', name: '左权县' },
          { code: 'pinglu', name: '平陆县' }
        ]
      },
      {
        code: 'shuozhou',
        name: '朔州市',
        children: [
          { code: 'shengli', name: '胜利区' },
          { code: 'hongtai', name: '红涛区' },
          { code: 'shuzhi', name: '舒志区' },
          { code: 'pinglu', name: '平陆县' },
          { code: 'lingchuan', name: '陵川县' },
          { code: 'fangshan', name: '方山县' }
        ]
      },
      {
        code: 'jinzhong',
        name: '晋中市',
        children: [
          { code: 'chengqu', name: '城区' },
          { code: 'zuoquan', name: '左权县' },
          { code: 'heping', name: '和平县' },
          { code: 'pinglu', name: '平陆县' },
          { code: 'yus', name: '榆社县' },
          { code: 'yangqu', name: '阳曲县' }
        ]
      },
      {
        code: 'yuncheng',
        name: '运城市',
        children: [
          { code: 'chengqu', name: '城区' },
          { code: 'xian', name: '县' },
          { code: 'pinglu', name: '平陆县' },
          { code: 'yuanqu', name: '垣曲县' },
          { code: 'hexian', name: '河曲县' },
          { code: 'zhongwei', name: '中卫县' }
        ]
      },
      {
        code: 'xinzhou',
        name: '忻州市',
        children: [
          { code: 'chengqu', name: '城区' },
          { code: 'xian', name: '县' },
          { code: 'wu', name: '五台县' },
          { code: 'fan', name: '繁峙县' },
          { code: 'guang', name: '广宗县' },
          { code: 'pinglu', name: '平陆县' }
        ]
      },
      {
        code: 'linfen',
        name: '临汾市',
        children: [
          { code: 'chengqu', name: '城区' },
          { code: 'xian', name: '县' },
          { code: 'gan', name: '甘愿县' },
          { code: 'fu', name: '浮山县' },
          { code: 'gao', name: '高平县' },
          { code: 'pinglu', name: '平陆县' }
        ]
      },
      {
        code: 'lvliang',
        name: '吕梁市',
        children: [
          { code: 'chengqu', name: '城区' },
          { code: 'xian', name: '县' },
          { code: 'feng', name: '汾阳县' },
          { code: 'shi', name: '石楼县' },
          { code: 'ling', name: '陵川县' }
        ]
      }
    ]
  },
  // 辽宁省
  {
    code: 'ln',
    name: '辽宁省',
    children: [
      {
        code: 'shenyang',
        name: '沈阳市',
        children: [
          { code: 'heping', name: '和平区' },
          { code: 'shenhe', name: '沈河区' },
          { code: 'dayehu', name: '大叶湖区' },
          { code: 'feiyu', name: 'feiyu区' },
          { code: 'sujiatun', name: '苏家屯区' },
          { code: 'hohhot', name: '呼和浩特区' },
          { code: 'dongling', name: '东陵区' },
          { code: 'xichuan', name: '西川区' },
          { code: 'xinmin', name: '新民市' },
          { code: 'daocheng', name: '道成县' }
        ]
      },
      {
        code: 'dalian',
        name: '大连市',
        children: [
          { code: 'zhongshan', name: '中山区' },
          { code: 'xigang', name: '西岗区' },
          { code: 'shahekou', name: '沙河口区' },
          { code: 'guliao', name: ' Guliao区' },
          { code: 'ganjingzi', name: '甘井子区' },
          { code: 'xigang', name: '西岗区' },
          { code: 'pudian', name: '普兰店区' },
          { code: 'chengsi', name: '城四区' },
          { code: 'huangdao', name: '黄岛区' },
          { code: 'changxing', name: '长兴区' }
        ]
      },
      {
        code: 'anshan',
        name: '鞍山市',
        children: [
          { code: 'tieling', name: '铁西区' },
          { code: 'taoshan', name: '台山区' },
          { code: 'haicheng', name: '海城市' },
          { code: 'tai\'an', name: '泰安区' },
          { code: 'liu', name: '刘区' },
          { code: 'xiangshan', name: '相山区' },
          { code: 'yingkou', name: '营口区' },
          { code: 'fuxin', name: '阜新区' }
        ]
      },
      {
        code: 'fushun',
        name: '抚顺市',
        children: [
          { code: 'shunping', name: '顺平区' },
          { code: 'dongzhou', name: '东洲区' },
          { code: 'wangqing', name: '望清区' },
          { code: 'gaizhi', name: '盖州市' },
          { code: 'panshi', name: '磐石市' },
          { code: 'huanren', name: '桓仁县' }
        ]
      },
      {
        code: 'benxi',
        name: '本溪市',
        children: [
          { code: 'pingdong', name: '平东区' },
          { code: 'pingxi', name: '平西区' },
          { code: 'nan', name: '南桥区' },
          { code: 'xiaoshi', name: '小市区' },
          { code: 'benxi', name: '本溪县' },
          { code: 'huanren', name: '桓仁县' }
        ]
      },
      {
        code: 'dandong',
        name: '丹东市',
        children: [
          { code: 'yuan', name: '元山区' },
          { code: 'zhenjiang', name: '镇江区' },
          { code: 'dong', name: '东街区' },
          { code: 'ancheng', name: '安城市' },
          { code: 'xianshi', name: '仙市区' },
          { code: 'kuanping', name: '宽甸县' }
        ]
      },
      {
        code: 'jinzhou',
        name: '锦州市',
        children: [
          { code: 'taoji', name: '桃园区' },
          { code: 'linghe', name: '凌河区' },
          { code: 'lingshan', name: '凌山区' },
          { code: 'dashan', name: '大山区' },
          { code: 'heishi', name: '黑山县' },
          { code: 'yingkou', name: '营口县' }
        ]
      },
      {
        code: 'yingkou',
        name: '营口市',
        children: [
          { code: 'hanqiu', name: '瀚秋区' },
          { code: 'bobushi', name: '鲅鱼圈区' },
          { code: 'laoling', name: '老岭区' },
          { code: 'fulu', name: '福禄区' },
          { code: 'dashan', name: '大山区' },
          { code: 'pan', name: '磐石市' }
        ]
      },
      {
        code: 'fuxin',
        name: '阜新市',
        children: [
          { code: 'haizhou', name: '海州区' },
          { code: 'xinmin', name: '新民市' },
          { code: 'fuxin', name: '阜新县' },
          { code: 'heishan', name: '黑山县' },
          { code: 'tai\'an', name: '泰安区' },
          { code: 'yu', name: '峪区' }
        ]
      },
      {
        code: 'liaoyang',
        name: '辽阳市',
        children: [
          { code: 'white', name: '白塔区' },
          { code: 'wen', name: '文湖区' },
          { code: 'lingbei', name: '陵北区' },
          { code: 'liaoyang', name: '辽阳县' },
          { code: 'taian', name: '泰安区' },
          { code: 'hulan', name: '葫芦岛区' }
        ]
      },
      {
        code: 'panjin',
        name: '盘锦市',
        children: [
          { code: 'shuangtaizi', name: '双台子区' },
          { code: 'xinglong', name: '兴隆区' },
          { code: 'ganglong', name: '港龙区' },
          { code: 'panshan', name: '盘山县' },
          { code: 'kuandian', name: '宽甸县' }
        ]
      },
      {
        code: 'tieling',
        name: '铁岭市',
        children: [
          { code: 'yinhuan', name: '银环区' },
          { code: 'qing', name: '清河区' },
          { code: 'lingbei', name: '陵北区' },
          { code: 'tieling', name: '铁岭县' },
          { code: 'xiangkui', name: '项奎县' },
          { code: 'kuanping', name: '宽甸县' }
        ]
      },
      {
        code: 'chaoyang',
        name: '朝阳市',
        children: [
          { code: 'shuangta', name: '双塔区' },
          { code: 'longcheng', name: '龙城区' },
          { code: 'changshan', name: '常山区' },
          { code: 'longkou', name: '龙口区' },
          { code: 'beizhen', name: '北镇市' },
          { code: 'kuanping', name: '宽甸县' }
        ]
      },
      {
        code: 'huludao',
        name: '葫芦岛市',
        children: [
          { code: 'lianhuang', name: '连晃区' },
          { code: 'xinglong', name: '兴隆区' },
          { code: 'xingcheng', name: '兴城市' },
          { code: 'xuanyuan', name: '轩辕区' },
          { code: 'changli', name: '昌黎县' },
          { code: 'kuandian', name: '宽甸县' }
        ]
      }
    ]
  },
  // 吉林省
  {
    code: 'jl',
    name: '吉林省',
    children: [
      {
        code: 'changchun',
        name: '长春市',
        children: [
          { code: 'chaoyang', name: '朝阳区' },
          { code: 'kuancheng', name: '宽城区' },
          { code: 'erdao', name: '二道区' },
          { code: 'lvyuan', name: '绿园区' },
          { code: 'gaoxin', name: '高新区' },
          { code: 'jingyue', name: '净月区' },
          { code: 'hetai', name: '和泰区' },
          { code: 'qianzhou', name: '公主岭市' },
          { code: 'lingyuan', name: '陵源区' }
        ]
      },
      {
        code: 'jilin',
        name: '吉林市',
        children: [
          { code: 'chuanyuan', name: '船营区' },
          { code: 'fengman', name: '丰满区' },
          { code: 'chuanyuan', name: '船营区' },
          { code: 'dongshan', name: '东山区' },
          { code: 'longtan', name: '龙潭区' },
          { code: 'chuanyuan', name: '船营区' },
          { code: 'beidian', name: '北甸区' },
          { code: 'fengman', name: '丰满区' },
          { code: 'shulan', name: '舒兰市' },
          { code: 'fuyu', name: '扶余市' }
        ]
      },
      {
        code: 'siping',
        name: '四平市',
        children: [
          { code: 'tiexi', name: '铁西区' },
          { code: 'tieliao', name: '铁东区' },
          { code: 'liuhe', name: '梨树县' },
          { code: 'yongji', name: '永吉县' },
          { code: 'fuxing', name: '福兴县' }
        ]
      },
      {
        code: 'liaoyuan',
        name: '辽源市',
        children: [
          { code: 'longshan', name: '龙山区' },
          { code: 'xian', name: '县' },
          { code: 'dongfeng', name: '东风县' },
          { code: 'xian', name: '县' }
        ]
      },
      {
        code: 'tonghua',
        name: '通化市',
        children: [
          { code: 'dongchong', name: '东昌区' },
          { code: 'er', name: '二道江区' },
          { code: 'nan', name: '南新区' },
          { code: 'huanren', name: '桓仁县' },
          { code: 'meihekou', name: '梅河口市' }
        ]
      },
      {
        code: 'baishan',
        name: '白山市',
        children: [
          { code: 'jiang', name: '江江区' },
          { code: 'nan', name: '南新区' },
          { code: 'gaizhi', name: '盖州市' },
          { code: 'fangian', name: '方安县' },
          { code: 'changbaishan', name: '长白山' }
        ]
      },
      {
        code: 'songyuan',
        name: '松原市',
        children: [
          { code: 'ningjiang', name: '宁江区' },
          { code: 'fuyu', name: '扶余市' },
          { code: 'qianan', name: '前安县' },
          { code: 'lian', name: '连县' }
        ]
      },
      {
        code: 'baicheng',
        name: '白城市',
        children: [
          { code: 'tao', name: '洮北区' },
          { code: 'mei', name: '梅河口区' },
          { code: 'ku', name: '库区' },
          { code: 'tao', name: '洮南市' }
        ]
      },
      {
        code: 'yanbian',
        name: '延边朝鲜族自治州',
        children: [
          { code: 'yanji', name: '延吉市' },
          { code: 'xiangfan', name: '向阳区' },
          { code: 'dongan', name: '东安区' },
          { code: 'ning\'an', name: '宁安县' },
          { code: 'helong', name: '鹤龙县' }
        ]
      }
    ]
  },
  // 黑龙江省
  {
    code: 'hlj',
    name: '黑龙江省',
    children: [
      {
        code: 'haerbin',
        name: '哈尔滨市',
        children: [
          { code: 'daigo', name: '道里区' },
          { code: 'nan', name: '南岗区' },
          { code: 'daigo', name: '道外区' },
          { code: 'pingfang', name: '平房区' },
          { code: 'xiangfang', name: '香坊区' },
          { code: 'hulan', name: '呼兰区' },
          { code: 'songbei', name: '松北区' },
          { code: 'xiu', name: '秀区' },
          { code: 'shangzi', name: '尚志市' },
          { code: 'wei', name: '苇河区' }
        ]
      },
      {
        code: 'qiqihar',
        name: '齐齐哈尔市',
        children: [
          { code: 'longsheng', name: '龙胜区' },
          { code: 'nian', name: '碾子山区' },
          { code: 'fuyu', name: '富裕县' },
          { code: 'zhao', name: '昭山区' },
          { code: 'longjiang', name: '龙江县' },
          { code: 'keshan', name: '克山县' }
        ]
      },
      {
        code: 'jixi',
        name: '鸡西市',
        children: [
          { code: 'jicheng', name: '鸡冠区' },
          { code: 'heng', name: '横山区' },
          { code: 'chengzihe', name: '城子河区' },
          { code: 'mishan', name: '密山市' },
          { code: 'liuhe', name: '六合县' }
        ]
      },
      {
        code: 'heshi',
        name: '鹤岗市',
        children: [
          { code: 'xiangyang', name: '向阳区' },
          { code: 'xinglong', name: '兴隆区' },
          { code: 'huangqi', name: '黄岐区' },
          { code: 'nan', name: '南山区' },
          { code: 'fengle', name: '凤岭区' }
        ]
      },
      {
        code: 'shuangyashan',
        name: '双鸭山市',
        children: [
          { code: 'baoshan', name: '宝山区' },
          { code: 'xian', name: '县' },
          { code: 'jixian', name: '集贤县' },
          { code: 'fengxi', name: '凤溪区' }
        ]
      },
      {
        code: 'daqing',
        name: '大庆市',
        children: [
          { code: 'longfeng', name: '龙凤区' },
          { code: 'dangan', name: '安定区' },
          { code: 'duchang', name: '杜长区' },
          { code: 'rong', name: '荣区' },
          { code: 'zhuang', name: '壮区' }
        ]
      },
      {
        code: 'jiamusi',
        name: '佳木斯市',
        children: [
          { code: 'jiadong', name: '佳东区' },
          { code: 'jiaxi', name: '佳西区' },
          { code: 'xiangyang', name: '香坊区' },
          { code: 'nan', name: '南山区' },
          { code: 'fengxi', name: '凤翔区' },
          { code: 'fuyu', name: '富裕县' }
        ]
      },
      {
        code: 'wudalianchi',
        name: '五大连池市',
        children: [
          { code: 'longgang', name: '龙岗区' },
          { code: 'xiangyang', name: '向阳区' },
          { code: 'xin', name: '新江区' },
          { code: 'nian', name: '年安县' }
        ]
      },
      {
        code: 'yanji',
        name: '延吉市',
        children: [
          { code: 'xiangyang', name: '向阳区' },
          { code: 'dong\'an', name: '东安区' },
          { code: 'ning\'an', name: '宁安县' },
          { code: 'helong', name: '鹤龙县' }
        ]
      },
      {
        code: 'hegang',
        name: '鹤岗市',
        children: [
          { code: 'xiangyang', name: '向阳区' },
          { code: 'xinglong', name: '兴隆区' },
          { code: 'huangqi', name: '黄岐区' },
          { code: 'nan', name: '南山区' },
          { code: 'fengle', name: '凤岭区' }
        ]
      },
      {
        code: 'xilingol',
        name: '锡林郭勒盟',
        children: [
          { code: 'xilin', name: '锡林区' },
          { code: 'erlian', name: '二连市' },
          { code: 'duolun', name: '多伦县' },
          { code: 'zhurihe', name: '朱日和' }
        ]
      }
    ]
  },
  // 江苏省
  {
    code: 'js',
    name: '江苏省',
    children: [
      {
        code: 'nanjing',
        name: '南京市',
        children: [
          { code: 'zhonghuamen', name: '中华门区' },
          { code: 'xuanwu', name: '玄武区' },
          { code: 'tabai', name: '台百区' },
          { code: 'jianshe', name: '建设区' },
          { code: 'zhonghe', name: '中华区' },
          { code: 'jiangning', name: '江宁区' },
          { code: 'jiangbei', name: '江北区' },
          { code: 'pukou', name: '浦口区' },
          { code: 'qidong', name: '启东区' },
          { code: 'lingui', name: '临湖区' }
        ]
      },
      {
        code: 'wuxi',
        name: '无锡市',
        children: [
          { code: 'lihu', name: '梁湖区' },
          { code: 'binhu', name: '滨湖区' },
          { code: 'xinwu', name: '新吴区' },
          { code: 'jiangning', name: '江宁区' },
          { code: 'yixing', name: '宜兴市' },
          { code: 'jiangyin', name: '江阴市' }
        ]
      },
      {
        code: 'xuzhou',
        name: '徐州市',
        children: [
          { code: 'gulou', name: '鼓楼区' },
          { code: 'yunlong', name: '云龙区' },
          { code: 'jiujiang', name: '九江区' },
          { code: 'xiccheng', name: '西城区' },
          { code: 'peixian', name: '沛县' },
          { code: 'shandong', name: '山东省' }
        ]
      },
      {
        code: 'changzhou',
        name: '常州市',
        children: [
          { code: 'zhonglun', name: '钟楼区' },
          { code: 'tianning', name: '天宁区' },
          { code: 'wujin', name: '武进区' },
          { code: 'xiushi', name: '戚墅堰区' },
          { code: 'jiujiang', name: '九江区' },
          { code: 'yixing', name: '宜兴区' }
        ]
      },
      {
        code: 'suzhou',
        name: '苏州市',
        children: [
          { code: 'gongshen', name: '姑苏区' },
          { code: 'huqiu', name: '虎丘区' },
          { code: 'wujiang', name: '吴江区' },
          { code: 'changshu', name: '常熟市' },
          { code: 'zhang', name: '张江区' },
          { code: 'kunshan', name: '昆山市' },
          { code: 'suzhou', name: '苏州市' }
        ]
      },
      {
        code: 'nantong',
        name: '南通市',
        children: [
          { code: 'chongqi', name: '崇川区' },
          { code: 'gangzha', name: '港闸区' },
          { code: 'tongzhou', name: '通州区' },
          { code: 'rugao', name: '如皋市' },
          { code: 'hai\'an', name: '海安县' },
          { code: 'haimen', name: '海门区' }
        ]
      },
      {
        code: 'yangzhou',
        name: '扬州市',
        children: [
          { code: 'guazhou', name: '瓜洲区' },
          { code: 'gaoyou', name: '高邮区' },
          { code: 'jiangdu', name: '江都区' },
          { code: 'baoan', name: '宝安区' },
          { code: 'yizheng', name: '仪征市' },
          { code: 'yangzhou', name: '扬州市' }
        ]
      },
      {
        code: 'zhenjiang',
        name: '镇江市',
        children: [
          { code: 'runzhou', name: '润州区' },
          { code: 'dantu', name: '丹徒区' },
          { code: 'jurong', name: '句容区' },
          { code: 'jiujiang', name: '九江区' },
          { code: 'lingui', name: '临湖区' },
          { code: 'yangzhou', name: '扬州市' }
        ]
      },
      {
        code: 'taizhou',
        name: '泰州市',
        children: [
          { code: 'lingpu', name: '陵湖区' },
          { code: 'jingjiang', name: '靖江市' },
          { code: 'taixing', name: '泰兴市' },
          { code: 'jiangyan', name: '姜堰区' },
          { code: 'lingpu', name: '陵港区' },
          { code: 'yangzhou', name: '扬州市' }
        ]
      },
      {
        code: 'suqian',
        name: '宿迁市',
        children: [
          { code: 'xiushui', name: '秀水区' },
          { code: 'suzhou', name: '苏州市' },
          { code: 'lingpu', name: '陵湖区' },
          { code: 'jiangyan', name: '姜堰区' },
          { code: 'lingpu', name: '陵港区' },
          { code: 'yangzhou', name: '扬州市' }
        ]
      }
    ]
  },
  // 浙江省
  {
    code: 'zj',
    name: '浙江省',
    children: [
      {
        code: 'hangzhou',
        name: '杭州市',
        children: [
          { code: 'shangcheng', name: '上城区' },
          { code: 'xicheng', name: '西城区' },
          { code: 'binjiang', name: '滨江区' },
          { code: 'haishu', name: '海曙区' },
          { code: 'jianggan', name: '江干区' },
          { code: 'xiasha', name: '下沙区' },
          { code: 'yuhang', name: '余杭区' },
          { code: 'xiaoshan', name: '萧山区' },
          { code: 'linan', name: '临安区' },
          { code: 'jiubao', name: '九保区' }
        ]
      },
      {
        code: 'ningbo',
        name: '宁波市',
        children: [
          { code: 'jiangbei', name: '江北区' },
          { code: 'jiangdong', name: '江东区' },
          { code: 'jintang', name: '镇海区' },
          { code: 'yinzhou', name: '鄞州区' },
          { code: 'beilun', name: '北仑区' },
          { code: 'cixi', name: '慈溪市' },
          { code: 'fenghua', name: '奉化区' },
          { code: 'xiangshan', name: '象山县' },
          { code: 'ninghai', name: '宁海县' }
        ]
      },
      {
        code: 'wenzhou',
        name: '温州市',
        children: [
          { code: 'lucheng', name: '鹿城区' },
          { code: 'longwan', name: '龙湾区' },
          { code: 'rongcheng', name: '榕城区' },
          { code: 'rongcheng', name: '瑞安市' },
          { code: 'yongjia', name: '永嘉县' },
          { code: 'pingyang', name: '平阳县' },
          { code: 'cangnan', name: '苍南县' }
        ]
      },
      {
        code: 'jiaxing',
        name: '嘉兴市',
        children: [
          { code: 'nanxun', name: '南浔区' },
          { code: 'xiuzhou', name: '秀州区' },
          { code: 'jiaxing', name: '嘉兴区' },
          { code: 'haiyan', name: '海盐县' },
          { code: 'pinghu', name: '平湖市' },
          { code: 'tongxiang', name: '桐乡市' }
        ]
      },
      {
        code: 'huzhou',
        name: '湖州市',
        children: [
          { code: 'cheng', name: '城山区' },
          { code: 'nanxun', name: '南浔区' },
          { code: 'deqing', name: '德清县' },
          { code: 'changxing', name: '长兴县' },
          { code: 'anji', name: '安吉县' }
        ]
      },
      {
        code: 'shaoxing',
        name: '绍兴市',
        children: [
          { code: 'yuecheng', name: '越城区' },
          { code: 'shaoxing', name: '绍兴区' },
          { code: 'shangyu', name: '上虞区' },
          { code: 'shaoxing', name: '绍兴县' },
          { code: 'xin', name: '新昌县' },
          { code: 'zhuji', name: '诸暨市' }
        ]
      },
      {
        code: 'jinhua',
        name: '金华市',
        children: [
          { code: 'jindong', name: '金东区' },
          { code: 'wucheng', name: '武城区' },
          { code: 'jinhua', name: '金华區' },
          { code: 'yiwu', name: '义乌市' },
          { code: 'jinhua', name: '金华市' },
          { code: 'yongkang', name: '永康市' }
        ]
      },
      {
        code: 'quzhou',
        name: '衢州市',
        children: [
          { code: 'kecheng', name: '柯城区' },
          { code: 'qujiang', name: '衢江区' },
          { code: 'changshan', name: '常山县' },
          { code: 'kaihua', name: '开化县' },
          { code: 'longyou', name: '龙游县' }
        ]
      },
      {
        code: 'zhoushan',
        name: '舟山市',
        children: [
          { code: 'dinghai', name: '定海区' },
          { code: 'putuo', name: '普陀区' },
          { code: 'zhoushan', name: '舟山區' },
          { code: 'daishan', name: '岱山县' },
          { code: 'tongqi', name: '嵊泗县' }
        ]
      },
      {
        code: 'taizhou',
        name: '台州市',
        children: [
          { code: 'huancheng', name: '环城区' },
          { code: 'luqiao', name: '路桥区' },
          { code: 'yunxiao', name: '云霄区' },
          { code: 'sanmen', name: '三门县' },
          { code: 'tian', name: '天台县' },
          { code: 'xiu', name: '秀水区' }
        ]
      },
      {
        code: 'lishui',
        name: '丽水市',
        children: [
          { code: 'li', name: '丽城市' },
          { code: 'li', name: '丽水区' },
          { code: 'songyang', name: '松阳县' },
          { code: 'yunhe', name: '云和县' },
          { code: 'qinghe', name: '青河县' },
          { code: 'jinyun', name: '缙云县' }
        ]
      }
    ]
  },
  // 安徽省
  {
    code: 'ah',
    name: '安徽省',
    children: [
      {
        code: 'hefei',
        name: '合肥市',
        children: [
          { code: 'yuelu', name: '蜀山区' },
          { code: 'shushan', name: '蜀山区' },
          { code: 'lujiang', name: '庐江县' },
          { code: 'feidong', name: '肥东县' },
          { code: 'feixi', name: '肥西县' },
          { code: 'changjiang', name: '长宁县' }
        ]
      },
      {
        code: 'wuhu',
        name: '芜湖市',
        children: [
          { code: 'jingjiang', name: '镜湖区' },
          { code: 'xihu', name: '西湖区' },
          { code: 'jiujiang', name: '九江区' },
          { code: 'nanling', name: '南陵县' },
          { code: 'wuwei', name: '无为县' },
          { code: 'fanchang', name: '繁昌县' }
        ]
      },
      {
        code: 'bengbu',
        name: '蚌埠市',
        children: [
          { code: 'longzhu', name: '龙珠区' },
          { code: 'hudong', name: '湖东区' },
          { code: 'hudong', name: '禹会区' },
          { code: 'huaiyuan', name: '怀远县' },
          { code: 'sixian', name: '泗县' },
          { code: 'lingbi', name: '灵璧县' }
        ]
      },
      {
        code: 'huainan',
        name: '淮南市',
        children: [
          { code: 'daobing', name: '道冰区' },
          { code: 'tianjia', name: '田家庵区' },
          { code: 'panji', name: '潘集区' },
          { code: 'fengtai', name: '凤台县' },
          { code: 'daojiao', name: '大脚区' }
        ]
      },
      {
        code: 'maanshan',
        name: '马鞍山市',
        children: [
          { code: 'huashan', name: '花山区' },
          { code: 'yushan', name: '雨山区' },
          { code: 'huangshan', name: '黄山区' },
          { code: 'andong', name: '东区' },
          { code: 'andong', name: '当涂县' }
        ]
      },
      {
        code: 'huaibei',
        name: '淮北市',
        children: [
          { code: 'duji', name: '杜集区' },
          { code: 'xiangshan', name: '相山区' },
          { code: 'zuopu', name: 'zuopu区' },
          { code: 'pujiang', name: '蒲江县' },
          { code: 'suzhou', name: '宿州市' }
        ]
      },
      {
        code: 'tongling',
        name: '铜陵市',
        children: [
          { code: 'jiangjun', name: '将军区' },
          { code: 'tongguan', name: '铜官区' },
          { code: 'xiangshan', name: '香山区' },
          { code: 'liu\'an', name: '六安县' },
          { code: 'lingshi', name: '陵水县' }
        ]
      },
      {
        code: 'anqing',
        name: '安庆市',
        children: [
          { code: 'yuanding', name: '源Ding区' },
          { code: 'yuexi', name: '岳西县' },
          { code: 'taohu', name: '桃花县' },
          { code: 'Susong', name: '宿松县' },
          { code: 'xicache', name: '西城区' }
        ]
      },
      {
        code: 'huangshan',
        name: '黄山市',
        children: [
          { code: 'tunxi', name: '屯溪区' },
          { code: 'huangshan', name: '黄山风景区' },
          { code: 'yixian', name: '黟县' },
          { code: 'qimen', name: '祁门县' },
          { code: 'shexian', name: '歙县' }
        ]
      },
      {
        code: 'chuzhou',
        name: '滁州市',
        children: [
          { code: 'linghu', name: 'lingen湖' },
          { code: 'nanquan', name: '南泉区' },
          { code: 'fengyang', name: '凤阳县' },
          { code: 'dingyuan', name: '定远县' },
          { code: 'quanyuan', name: '全椒县' }
        ]
      },
      {
        code: 'fuyang',
        name: '阜阳市',
        children: [
          { code: 'yingzhou', name: '颍州区' },
          { code: 'yingdong', name: '颍东区' },
          { code: 'yingxi', name: '颍西区' },
          { code: 'linquan', name: '临泉县' },
          { code: 'jianchang', name: '建昌县' }
        ]
      },
      {
        code: 'suzhou',
        name: '宿州市',
        children: [
          { code: 'tongshan', name: '埇桥区' },
          { code: 'lingbi', name: '灵璧县' },
          { code: 'suzhou', name: '宿州市' },
          { code: 'peixian', name: '沛县' }
        ]
      },
      {
        code: 'luan',
        name: '六安市',
        children: [
          { code: 'jinan', name: '金安区' },
          { code: 'shouxian', name: '寿县' },
          { code: 'huoqiu', name: '霍邱县' },
          { code: 'huoshan', name: '霍山县' },
          { code: 'jinzhai', name: '金寨县' }
        ]
      },
      {
        code: 'bozhou',
        name: '亳州市',
        children: [
          { code: 'chaoyang', name: '谯城区' },
          { code: 'guoyang', name: '涡阳县' },
          { code: 'qianshan', name: '潜山县' },
          { code: 'xuancheng', name: '宣城市' }
        ]
      },
      {
        code: 'chizhou',
        name: '池州市',
        children: [
          { code: 'guichi', name: '贵池区' },
          { code: 'qianxian', name: '青阳县' },
          { code: 'dongzhi', name: '东至县' },
          { code: 'shitai', name: '石台县' }
        ]
      },
      {
        code: 'xuancheng',
        name: '宣城市',
        children: [
          { code: 'xuanzhou', name: '宣州区' },
          { code: 'ningguo', name: '宁国市' },
          { code: 'jingxian', name: '泾县' },
          { code: 'jixi', name: '绩溪县' },
          { code: 'jiedong', name: '结东区' }
        ]
      }
    ]
  },
  // 福建省
  {
    code: 'fj',
    name: '福建省',
    children: [
      {
        code: 'fuzhou',
        name: '福州市',
        children: [
          { code: 'gulou', name: '鼓楼区' },
          { code: 'taicheng', name: '台江区' },
          { code: 'cangshan', name: '仓山区' },
          { code: 'mawei', name: '马尾区' },
          { code: 'pingtan', name: '平潭县' },
          { code: 'fuqing', name: '福清市' },
          { code: 'changlev', name: '长乐区' }
        ]
      },
      {
        code: 'xiamen',
        name: '厦门市',
        children: [
          { code: 'hudong', name: '湖里区' },
          { code: 'siming', name: '思明区' },
          { code: 'haicang', name: '海沧区' },
          { code: 'tong', name: '同安区' },
          { code: 'jimei', name: '集美区' }
        ]
      },
      {
        code: 'putian',
        name: '莆田市',
        children: [
          { code: 'chengxiang', name: '城厢区' },
          { code: 'hanshan', name: '涵江区' },
          { code: 'lishui', name: '荔城区' },
          { code: 'xiuyu', name: '秀屿区' },
          { code: 'xianyou', name: '仙游县' }
        ]
      },
      {
        code: 'sanming',
        name: '三明市',
        children: [
          { code: 'mei', name: '梅列区' },
          { code: 'sanming', name: '三明区' },
          { code: 'mingxi', name: '明溪县' },
          { code: 'qingliu', name: '清流县' },
          { code: 'ninghua', name: '宁化县' }
        ]
      },
      {
        code: 'quanzhou',
        name: '泉州市',
        children: [
          { code: 'lingjiang', name: '鲤城区' },
          { code: 'huian', name: '惠安县' },
          { code: 'nanan', name: '南安县' },
          { code: 'anjing', name: '安靖县' },
          { code: 'shishi', name: '石狮市' }
        ]
      },
      {
        code: 'zhangzhou',
        name: '漳州市',
        children: [
          { code: 'longwen', name: '龙文区' },
          { code: 'yuexi', name: '芗城区' },
          { code: 'taihe', name: '太和区' },
          { code: 'changtai', name: '长泰县' },
          { code: 'zhangpu', name: '漳浦县' }
        ]
      },
      {
        code: 'nanchang',
        name: '南昌市',
        children: [
          { code: 'donghu', name: '东湖区' },
          { code: 'xiangshan', name: '芗城区' },
          { code: 'ganzhou', name: '赣州市' },
          { code: 'jiujiang', name: '九江区' }
        ]
      },
      {
        code: 'longyan',
        name: '龙岩市',
        children: [
          { code: 'xinluo', name: '新罗区' },
          { code: 'changting', name: '长汀县' },
          { code: 'yongding', name: '永定县' },
          { code: 'hangzhou', name: '杭州市' }
        ]
      },
      {
        code: 'ningde',
        name: '宁德市',
        children: [
          { code: 'xiangcheng', name: '芗城区' },
          { code: 'fuan', name: '福安市' },
          { code: 'fuqing', name: '福清市' },
          { code: 'ningde', name: '宁德市' }
        ]
      }
    ]
  },
  // 广东省
  {
    code: 'gd',
    name: '广东省',
    children: [
      {
        code: 'guangzhou',
        name: '广州市',
        children: [
          { code: 'yuexiu', name: '越秀区' },
          { code: 'liwan', name: '荔湾区' },
          { code: 'huadong', name: '花都区' },
          { code: 'huangpu', name: '黄埔区' },
          { code: 'nansha', name: '南沙区' },
          { code: 'conghua', name: '从化区' },
          { code: 'zengcheng', name: '增城区' }
        ]
      },
      {
        code: 'shenzhen',
        name: '深圳市',
        children: [
          { code: 'futian', name: '福田区' },
          { code: 'nanshan', name: '南山区' },
          { code: 'luohu', name: '罗湖区' },
          { code: 'yantian', name: '盐田区' },
          { code: 'baoan', name: '宝安区' },
          { code: 'longgang', name: '龙岗区' },
          { code: 'longhua', name: '龙华区' }
        ]
      },
      {
        code: 'zhuhai',
        name: '珠海市',
        children: [
          { code: 'xiangzhou', name: '香洲区' },
          { code: 'Doumen', name: '斗门区' },
          { code: 'jinwan', name: '金湾区' }
        ]
      },
      {
        code: 'shantou',
        name: '汕头市',
        children: [
          { code: 'zhongshan', name: '中山街道' },
          { code: 'jinping', name: '金平区' },
          { code: 'huaxia', name: '华夏区' },
          { code: 'nanao', name: '南澳县' }
        ]
      },
      {
        code: 'foshan',
        name: '佛山市',
        children: [
          { code: 'chancheng', name: '禅城区' },
          { code: 'nanzhou', name: '南庄镇' },
          { code: 'shunde', name: '顺德区' },
          { code: 'shanwei', name: '汕尾市' }
        ]
      },
      {
        code: 'shaoguan',
        name: '韶关市',
        children: [
          { code: 'jiangbei', name: '江北区' },
          { code: 'wengyuan', name: '翁源县' },
          { code: 'zhenjiang', name: '镇江区' },
          { code: 'shaoguan', name: '韶关市' }
        ]
      },
      {
        code: 'zhanjiang',
        name: '湛江市',
        children: [
          { code: 'chikan', name: '赤坎区' },
          { code: 'xiashan', name: '霞山区' },
          { code: 'mianjiang', name: '麻章区' },
          { code: 'suixi', name: '遂溪县' },
          { code: 'zhanjiang', name: '湛江市' }
        ]
      },
      {
        code: 'maoming',
        name: '茂名市',
        children: [
          { code: 'qianjin', name: '前进区' },
          { code: 'dianbai', name: '电白区' },
          { code: 'gaozhou', name: '高州市' },
          { code: 'huazhou', name: '化州市' }
        ]
      },
      {
        code: 'zhaoqing',
        name: '肇庆市',
        children: [
          { code: 'duan', name: '端州区' },
          { code: 'kuaiji', name: '葵涌区' },
          { code: 'siwei', name: '四会市' },
          { code: 'guangning', name: '广宁县' }
        ]
      },
      {
        code: 'jiangmen',
        name: '江门市',
        children: [
          { code: 'jianghai', name: '江海区' },
          { code: 'pengjiang', name: '蓬江区' },
          { code: 'xinhui', name: '新会区' },
          { code: 'taishan', name: '台山市' }
        ]
      },
      {
        code: 'zhanjiang',
        name: '湛江市',
        children: [
          { code: 'chikan', name: '赤坎区' },
          { code: 'xiashan', name: '霞山区' },
          { code: 'mianjiang', name: '麻章区' },
          { code: 'suixi', name: '遂溪县' },
          { code: 'zhanjiang', name: '湛江市' }
        ]
      },
      {
        code: 'shaoguan',
        name: '韶关市',
        children: [
          { code: 'jiangbei', name: '江北区' },
          { code: 'wengyuan', name: '翁源县' },
          { code: 'zhenjiang', name: '镇江区' },
          { code: 'shaoguan', name: '韶关市' }
        ]
      },
      {
        code: 'fangchenggang',
        name: '防城港市',
        children: [
          { code: 'jingjiang', name: '京江区' },
          { code: 'fucheng', name: '防城区' },
          { code: 'dongxing', name: '东兴市' }
        ]
      },
      {
        code: 'guangyuan',
        name: '广元市',
        children: [
          { code: 'jianguang', name: '剑阁县' },
          { code: 'cangxi', name: '苍溪县' },
          { code: 'guangyuan', name: '广元市' }
        ]
      },
      {
        code: 'meizhou',
        name: '梅州市',
        children: [
          { code: 'meijiang', name: '梅江区' },
          { code: 'meixian', name: '梅县区' },
          { code: 'jiaoling', name: '蕉岭县' },
          { code: 'fengshun', name: '丰顺县' }
        ]
      },
      {
        code: 'shanwei',
        name: '汕尾市',
        children: [
          { code: 'chengqu', name: '城区' },
          { code: 'haifeng', name: '海丰县' },
          { code: 'lufeng', name: '陆丰市' },
          { code: 'chenxi', name: '晨溪县' }
        ]
      },
      {
        code: 'heyuan',
        name: '河源市',
        children: [
          { code: 'yuancheng', name: '源城区' },
          { code: 'lianping', name: '连平县' },
          { code: 'heyuan', name: '河源市' }
        ]
      },
      {
        code: 'yangjiang',
        name: '阳江市',
        children: [
          { code: 'jiangcheng', name: '江城区' },
          { code: 'yangdong', name: '阳东区' },
          { code: 'yangchun', name: '阳春市' }
        ]
      },
      {
        code: 'qingyuan',
        name: '清远市',
        children: [
          { code: 'qingcheng', name: '清城区' },
          { code: 'qinyuan', name: '清新区' },
          { code: 'fengchang', name: '凤城镇' }
        ]
      },
      {
        code: 'dongguan',
        name: '东莞市',
        children: [
          { code: 'chengshan', name: '城区' },
          { code: 'changping', name: '常平区' },
          { code: 'guanlan', name: '观澜区' }
        ]
      },
      {
        code: 'zhongshan',
        name: '中山市',
        children: [
          { code: 'chengqu', name: '城区' },
          { code: 'nanlang', name: '南朗区' },
          { code: 'shiqi', name: '石岐区' }
        ]
      },
      {
        code: 'chaozhou',
        name: '潮州市',
        children: [
          { code: 'hanjiang', name: '韩江区' },
          { code: 'haibin', name: '海滨区' },
          { code: 'chaoan', name: '潮安区' }
        ]
      },
      {
        code: 'jieyang',
        name: '揭阳市',
        children: [
          { code: 'jitong', name: '揭东区' },
          { code: 'bijie', name: '毕节市' },
          { code: 'rongcheng', name: '榕城区' }
        ]
      },
      {
        code: 'yunfu',
        name: '云浮市',
        children: [
          { code: 'xiuquan', name: '秀全区' },
          { code: 'yun’an', name: '云安区' },
          { code: 'luocheng', name: '罗城镇' }
        ]
      }
    ]
  },
  // 广西壮族自治区
  {
    code: 'gx',
    name: '广西壮族自治区',
    children: [
      {
        code: 'nanning',
        name: '南宁市',
        children: [
          { code: 'xingning', name: '兴宁区' },
          { code: 'qingxiu', name: '青秀区' },
          { code: 'chongzuo', name: '崇左区' },
          { code: 'nanning', name: '南宁市' }
        ]
      },
      {
        code: 'liuzhou',
        name: '柳州市',
        children: [
          { code: 'chengzhong', name: '城中区' },
          { code: 'liucheng', name: '柳城县' },
          { code: 'liuzhou', name: '柳州市' }
        ]
      },
      {
        code: 'guilin',
        name: '桂林市',
        children: [
          { code: 'liziang', name: '漓江区' },
          { code: 'multa', name: '多乐区' },
          { code: 'guilin', name: '桂林市' }
        ]
      },
      {
        code: 'wuzhou',
        name: '梧州市',
        children: [
          { code: 'wanxi', name: '万秀区' },
          { code: 'longsheng', name: '龙胜区' },
          { code: 'wuzhou', name: '梧州市' }
        ]
      },
      {
        code: 'beihai',
        name: '北海市',
        children: [
          { code: 'haitang', name: '海城区' },
          { code: 'yinhai', name: '银海区' },
          { code: 'hebei', name: '北海区' }
        ]
      },
      {
        code: 'fangchenggang',
        name: '防城港市',
        children: [
          { code: 'dingxin', name: '定心区' },
          { code: 'gangkou', name: '港口区' },
          { code: 'fangcheng', name: '防城区' }
        ]
      },
      {
        code: 'qinzhou',
        name: '钦州市',
        children: [
          { code: 'qinzhou', name: '钦南区' },
          { code: 'qinbei', name: '钦北区' },
          { code: 'lingshan', name: '灵山县' }
        ]
      },
      {
        code: 'guigang',
        name: '贵港市',
        children: [
          { code: 'gangnan', name: '港南区' },
          { code: 'gangbei', name: '港北区' },
          { code: 'pingnan', name: '平南县' }
        ]
      },
      {
        code: 'yulin',
        name: '玉林市',
        children: [
          { code: 'yufeng', name: '玉州区' },
          { code: 'fumian', name: '福绵区' },
          { code: 'yulin', name: '玉林市' }
        ]
      },
      {
        code: 'baise',
        name: '百色市',
        children: [
          { code: 'chengdong', name: '城东区' },
          { code: 'chengxi', name: '城西区' },
          { code: 'baise', name: '百色市' }
        ]
      },
      {
        code: 'hechi',
        name: '河池市',
        children: [
          { code: 'jincheng', name: '金城江区' },
          { code: 'nandan', name: '南丹县' },
          { code: 'hechi', name: '河池市' }
        ]
      },
      {
        code: 'chongzuo',
        name: '崇左市',
        children: [
          { code: 'jiangzhou', name: '江州区' },
          { code: 'chongzuo', name: '崇左市' }
        ]
      },
      {
        code: 'laibin',
        name: '来宾市',
        children: [
          { code: 'xingbin', name: '兴宾区' },
          { code: 'laibin', name: '来宾市' }
        ]
      },
      {
        code: 'guigang',
        name: '桂平市',
        children: [
          { code: 'guiping', name: '桂平市' }
        ]
      }
    ]
  },
  // 海南省
  {
    code: 'hainan',
    name: '海南省',
    children: [
      {
        code: 'haikou',
        name: '海口市',
        children: [
          { code: 'xiuying', name: '秀英区' },
          { code: 'longhua', name: '龙华区' },
          { code: 'qiongshan', name: '琼山区' },
          { code: 'meilan', name: '美兰区' }
        ]
      },
      {
        code: 'sanya',
        name: '三亚市',
        children: [
          { code: 'yacheng', name: '崖州区' },
          { code: 'tianya', name: '天涯区' },
          { code: 'jiyang', name: '吉阳区' }
        ]
      },
      {
        code: 'sansha',
        name: '三沙市',
        children: [
          { code: 'yongshu', name: '永暑区' },
          { code: 'zhongye', name: '中业区' }
        ]
      },
      {
        code: 'wuzhishan',
        name: '五指山市',
        children: [
          { code: 'taoyuan', name: '桃园区' },
          { code: 'wuzhishan', name: '五指山市' }
        ]
      },
      {
        code: 'qionghai',
        name: '琼海市',
        children: [
          { code: 'bocheng', name: '博强区' },
          { code: 'qionghai', name: '琼海市' }
        ]
      },
      {
        code: 'wanning',
        name: '文昌市',
        children: [
          { code: 'wenchang', name: '文城区' },
          { code: 'wanning', name: '万宁市' }
        ]
      },
      {
        code: 'wanling',
        name: '万宁市',
        children: [
          { code: 'renxing', name: '仁兴区' },
          { code: 'wanling', name: '万宁市' }
        ]
      },
      {
        code: 'ledong',
        name: '乐东黎族自治县',
        children: [
          { code: 'liaoyang', name: '疗养区' },
          { code: 'ledong', name: '乐东县' }
        ]
      },
      {
        code: 'lingshui',
        name: '陵水黎族自治县',
        children: [
          { code: 'lingshui', name: '陵水县' }
        ]
      },
      {
        code: 'baisha',
        name: '白沙黎族自治县',
        children: [
          { code: 'baisha', name: '白沙县' }
        ]
      },
      {
        code: 'changjiang',
        name: '昌江黎族自治县',
        children: [
          { code: 'changjiang', name: '昌江县' }
        ]
      },
      {
        code: 'dingan',
        name: '定安县',
        children: [
          { code: 'dingan', name: '定安县' }
        ]
      },
      {
        code: 'chengmai',
        name: '澄迈县',
        children: [
          { code: 'chengmai', name: '澄迈县' }
        ]
      },
      {
        code: 'qzhong',
        name: '琼中黎族苗族自治县',
        children: [
          { code: 'qzhong', name: '琼中县' }
        ]
      }
    ]
  },
  // 陕西省
  {
    code: 'sx2',
    name: '陕西省',
    children: [
      {
        code: 'xian',
        name: '西安市',
        children: [
          { code: 'beilin', name: '碑林区' },
          { code: 'yanta', name: '雁塔区' },
          { code: 'yanta', name: '雁塔区' },
          { code: 'gaonan', name: '高南区' },
          { code: 'gaonan', name: '高陵区' },
          { code: 'changan', name: '长安区' },
          { code: 'xianyang', name: '咸阳市' }
        ]
      },
      {
        code: 'tongchuan',
        name: '铜川市',
        children: [
          { code: 'wangyi', name: '王益区' },
          { code: 'yaozhou', name: '耀州区' },
          { code: 'yaozhou', name: '耀州区' }
        ]
      },
      {
        code: 'baoji',
        name: '宝鸡市',
        children: [
          { code: 'jinpux', name: '金普区' },
          { code: 'baoji', name: '宝鸡市' }
        ]
      },
      {
        code: 'xianyang',
        name: '咸阳市',
        children: [
          { code: 'weicheng', name: '渭城区' },
          { code: 'qindong', name: '秦东区' },
          { code: 'xianyang', name: '咸阳市' }
        ]
      },
      {
        code: 'weinan',
        name: '渭南市',
        children: [
          { code: 'linjin', name: '临渭区' },
          { code: 'weinan', name: '渭南市' }
        ]
      },
      {
        code: 'yanan',
        name: '延安市',
        children: [
          { code: 'baochin', name: '宝 chin区' },
          { code: 'yanan', name: '延安市' }
        ]
      },
      {
        code: 'hanzhong',
        name: '汉中市',
        children: [
          { code: 'yingbin', name: '迎宾区' },
          { code: 'hanzhong', name: '汉中市' }
        ]
      },
      {
        code: 'yulin',
        name: '榆林市',
        children: [
          { code: 'daning', name: '大宁县' },
          { code: 'yulin', name: '榆林市' }
        ]
      },
      {
        code: 'ankang',
        name: '安康市',
        children: [
          { code: 'hanbin', name: '汉滨区' },
          { code: 'ankang', name: '安康市' }
        ]
      },
      {
        code: 'shangluo',
        name: '商洛市',
        children: [
          { code: 'bizhi', name: ' bizhi区' },
          { code: 'shangluo', name: '商洛市' }
        ]
      }
    ]
  },
  // 甘肃省
  {
    code: 'gs',
    name: '甘肃省',
    children: [
      {
        code: 'lanzhou',
        name: '兰州市',
        children: [
          { code: 'chenggu', name: '城关区' },
          { code: 'qili', name: '七里河区' },
          { code: '��', name: '西固区' },
          { code: 'anlei', name: '安宁区' },
          { code: 'yuzhong', name: '榆中县' }
        ]
      },
      {
        code: 'jiayuguan',
        name: '嘉峪关市',
        children: [
          { code: 'jiayu', name: '嘉峪关市' }
        ]
      },
      {
        code: 'jinchang',
        name: '金昌市',
        children: [
          { code: 'jinchang', name: '金川区' }
        ]
      },
      {
        code: 'baiyin',
        name: '白银市',
        children: [
          { code: 'baiyin', name: '白银区' }
        ]
      },
      {
        code: 'tianshui',
        name: '天水市',
        children: [
          { code: 'ging', name: '秦州区' },
          { code: 'ning', name: '宁区' }
        ]
      },
      {
        code: 'wuwei',
        name: '武威市',
        children: [
          { code: 'liangzhou', name: '凉州区' }
        ]
      },
      {
        code: 'zhangye',
        name: '张掖市',
        children: [
          { code: 'zhangye', name: '甘州区' }
        ]
      },
      {
        code: 'pingliang',
        name: '平凉市',
        children: [
          { code: 'pingliang', name: '崆峒区' }
        ]
      },
      {
        code: 'jiuquan',
        name: '酒泉市',
        children: [
          { code: 'jinta', name: '金塔县' }
        ]
      },
      {
        code: 'qingyang',
        name: '庆阳市',
        children: [
          { code: 'qingyang', name: '西峰区' }
        ]
      },
      {
        code: 'dingxi',
        name: '定西市',
        children: [
          { code: 'dingxi', name: '安定区' }
        ]
      },
      {
        code: 'longnan',
        name: '陇南市',
        children: [
          { code: 'longnan', name: '武都区' }
        ]
      },
      {
        code: 'linxia',
        name: '临夏回族自治州',
        children: [
          { code: 'linxia', name: '临夏市' }
        ]
      },
      {
        code: 'gannan',
        name: '甘南藏族自治州',
        children: [
          { code: 'gannan', name: '合作市' }
        ]
      }
    ]
  },
  // 青海省
  {
    code: 'qh',
    name: '青海省',
    children: [
      {
        code: 'xining',
        name: '西宁市',
        children: [
          { code: 'chengdong', name: '城东区' },
          { code: 'chengxi', name: '城西区' },
          { code: 'chengnan', name: '城南区' }
        ]
      },
      {
        code: 'haixi',
        name: '海西蒙古族藏族自治州',
        children: [
          { code: 'delingha', name: '德令哈市' }
        ]
      },
      {
        code: 'huangnan',
        name: '黄南藏族自治州',
        children: [
          { code: 'xunhua', name: '循化县' }
        ]
      },
      {
        code: 'hainan',
        name: '海南藏族自治州',
        children: [
          { code: 'tongde', name: '同德县' }
        ]
      },
      {
        code: 'haidong',
        name: '海东市',
        children: [
          { code: 'pingan', name: '平安区' }
        ]
      },
      {
        code: 'yushu',
        name: '玉树藏族自治州',
        children: [
          { code: 'yushu', name: '玉树市' }
        ]
      },
      {
        code: 'guoluo',
        name: '果洛藏族自治州',
        children: [
          { code: 'guoluo', name: '玛多县' }
        ]
      },
      {
        code: 'haixi',
        name: '海北藏族自治州',
        children: [
          { code: 'haixi', name: '海北州' }
        ]
      }
    ]
  },
  // 四川省
  {
    code: 'sc',
    name: '四川省',
    children: [
      {
        code: 'chengdu',
        name: '成都市',
        children: [
          { code: 'jinjiang', name: '锦江区' },
          { code: 'qingyang', name: '青羊区' },
          { code: 'wuhou', name: '武侯区' },
          { code: 'chenghua', name: '成华区' },
          { code: 'longquanyi', name: '龙泉驿区' },
          { code: 'qingbaijiang', name: '青白江区' },
          { code: 'xinjin', name: '新津区' },
          { code: 'chuanyi', name: '川益区' }
        ]
      },
      {
        code: 'zigong',
        name: '自贡市',
        children: [
          { code: 'gangquan', name: '贡井区' },
          { code: 'daan', name: '大安区' }
        ]
      },
      {
        code: 'panzhihua',
        name: '攀枝花市',
        children: [
          { code: 'renhe', name: '仁和区' },
          { code: 'xiuxi', name: '秀州区' }
        ]
      },
      {
        code: 'luzhou',
        name: '泸州市',
        children: [
          { code: 'jiangyang', name: '江阳区' },
          { code: 'naxi', name: '纳溪区' }
        ]
      },
      {
        code: 'deyang',
        name: '德阳市',
        children: [
          { code: 'chengdong', name: '城东区' },
          { code: 'chengxi', name: '城西区' }
        ]
      },
      {
        code: 'mianyang',
        name: '绵阳市',
        children: [
          { code: 'fucheng', name: '涪城区' },
          { code: 'xitang', name: '西塘区' }
        ]
      },
      {
        code: 'guangyuan',
        name: '广元市',
        children: [
          { code: 'licang', name: '利州区' },
          { code: 'shuangong', name: '双公区' }
        ]
      },
      {
        code: 'suining',
        name: '遂宁市',
        children: [
          { code: 'chuanyi', name: '船山区' },
          { code: 'anjian', name: '安居区' }
        ]
      },
      {
        code: 'neijiang',
        name: '内江市',
        children: [
          { code: 'zhongjiang', name: '中江区' },
          { code: 'dongxing', name: '东兴区' }
        ]
      },
      {
        code: 'lezhou',
        name: '乐山市',
        children: [
          { code: 'shanyi', name: '山益区' },
          { code: 'wugong', name: '五公区' }
        ]
      },
      {
        code: 'nanchong',
        name: '南充市',
        children: [
          { code: 'jialing', name: '嘉陵区' },
          { code: 'nanchong', name: '南充区' }
        ]
      },
      {
        code: 'meishan',
        name: '眉山市',
        children: [
          { code: 'dongpo', name: '东坡区' },
          { code: 'meishan', name: '眉山区' }
        ]
      },
      {
        code: 'yibin',
        name: '宜宾市',
        children: [
          { code: 'cuiping', name: '翠屏区' },
          { code: 'yibin', name: '宜宾区' }
        ]
      },
      {
        code: 'guangan',
        name: '广安市',
        children: [
          { code: 'xiangtang', name: '襄塘区' },
          { code: 'guangan', name: '广安区' }
        ]
      },
      {
        code: 'dazhou',
        name: '达州市',
        children: [
          { code: 'tongchuan', name: '通川区' },
          { code: 'dazhou', name: '达川区' }
        ]
      },
      {
        code: 'yaan',
        name: '雅安市',
        children: [
          { code: 'yucheng', name: '雨城区' },
          { code: 'yaan', name: '雅城区' }
        ]
      },
      {
        code: 'bazhong',
        name: '巴中市',
        children: [
          { code: 'bazhong', name: '巴州区' },
          { code: 'bazhong', name: '巴中区' }
        ]
      },
      {
        code: 'ziyang',
        name: '资阳市',
        children: [
          { code: '雁江', name: '雁江区' },
          { code: 'ziyang', name: '资阳区' }
        ]
      },
      {
        code: 'liangshan',
        name: '凉山彝族自治州',
        children: [
          { code: 'xichang', name: '西昌市' },
          { code: 'liangshan', name: '凉山州' }
        ]
      }
    ]
  },
  // 贵州省
  {
    code: 'gz',
    name: '贵州省',
    children: [
      {
        code: 'guiyang',
        name: '贵阳市',
        children: [
          { code: 'nantan', name: '南明区' },
          { code: 'yunyan', name: '云岩区' },
          { code: 'huaxi', name: '花溪区' }
        ]
      },
      {
        code: 'liupanshui',
        name: '六盘水市',
        children: [
          { code: 'zhongshan', name: '钟山区' },
          { code: 'liupanshui', name: '六盘水区' }
        ]
      },
      {
        code: 'zunyi',
        name: '遵义市',
        children: [
          { code: 'Honghualing', name: '红花岭区' },
          { code: 'xinpu', name: '新蒲区' }
        ]
      },
      {
        code: 'anshun',
        name: '安顺市',
        children: [
          { code: 'iping', name: '平区' },
          { code: 'xifeng', name: '西风区' }
        ]
      },
      {
        code: 'bijie',
        name: '毕节市',
        children: [
          { code: ' Bijie', name: '毕节区' },
          { code: 'bijie', name: '毕节区' }
        ]
      },
      {
        code: 'tongren',
        name: '铜仁市',
        children: [
          { code: 'renhuai', name: '仁怀区' },
          { code: 'tongren', name: '铜仁区' }
        ]
      },
      {
        code: 'qiannan',
        name: '黔南布依族苗族自治州',
        children: [
          { code: 'guiyang', name: '贵阳区' },
          { code: 'qiannan', name: '黔南区' }
        ]
      },
      {
        code: 'qiandongnan',
        name: '黔东南苗族侗族自治州',
        children: [
          { code: 'kaili', name: '凯里区' },
          { code: 'qiandongnan', name: '黔东南区' }
        ]
      },
      {
        code: 'qiandezhou',
        name: '黔西南布依族苗族自治州',
        children: [
          { code: 'xingyi', name: '兴义区' },
          { code: 'qiandezhou', name: '黔西南区' }
        ]
      }
    ]
  },
  // 云南省
  {
    code: 'yn',
    name: '云南省',
    children: [
      {
        code: 'kunming',
        name: '昆明市',
        children: [
          { code: 'wuhua', name: '五华区' },
          { code: 'nujiang', name: 'Nujiang区' },
          { code: 'panlong', name: '盘龙区' },
          { code: 'guandong', name: '官渡区' },
          { code: 'xishan', name: '西山区' }
        ]
      },
      {
        code: 'qujing',
        name: '曲靖市',
        children: [
          { code: 'zexi', name: '沾益区' },
          { code: 'luxi', name: '陆良县' }
        ]
      },
      {
        code: 'yuxi',
        name: '玉溪市',
        children: [
          { code: ' Hongshan', name: '红山區' },
          { code: 'jiangchuan', name: '江川区' }
        ]
      },
      {
        code: 'baoshan',
        name: '保山市',
        children: [
          { code: 'longyang', name: '龙阳区' },
          { code: 'longyang', name: '隆阳区' }
        ]
      },
      {
        code: 'zhaotong',
        name: '昭通市',
        children: [
          { code: 'zhaoyang', name: '昭阳区' },
          { code: 'zhaotong', name: '昭通区' }
        ]
      },
      {
        code: 'lijiang',
        name: '丽江市',
        children: [
          { code: 'gucheng', name: '古城区' },
          { code: 'yulong', name: '玉龙县' }
        ]
      },
      {
        code: 'puer',
        name: '普洱市',
        children: [
          { code: 'ningjiang', name: '宁江区' },
          { code: 'puer', name: '普洱区' }
        ]
      },
      {
        code: 'baoshan',
        name: '保山市',
        children: [
          { code: 'longyang', name: '龙阳区' },
          { code: 'longyang', name: '隆阳区' }
        ]
      },
      {
        code: 'weishan',
        name: '巍山彝族回族自治县',
        children: [
          { code: 'weishan', name: '巍山县' }
        ]
      },
      {
        code: 'wumeng',
        name: '武定县',
        children: [
          { code: 'wumeng', name: '武定县' }
        ]
      },
      {
        code: 'xishuangbanna',
        name: '西双版纳傣族自治州',
        children: [
          { code: 'jinghong', name: '景洪市' },
          { code: 'xishuangbanna', name: '西双版纳州' }
        ]
      },
      {
        code: 'dali',
        name: '大理白族自治州',
        children: [
          { code: 'dali', name: '大理市' },
          { code: 'dali', name: '大理州' }
        ]
      },
      {
        code: 'dehong',
        name: '德宏傣族景颇族自治州',
        children: [
          { code: 'lianghe', name: '梁河区' },
          { code: 'dehong', name: '德宏州' }
        ]
      },
      {
        code: 'nujiang',
        name: '怒江傈僳族自治州',
        children: [
          { code: 'luoshui', name: '泸水区' },
          { code: 'nujiang', name: '怒江州' }
        ]
      },
      {
        code: 'diqing',
        name: '迪庆藏族自治州',
        children: [
          { code: 'zhongdian', name: '中甸区' },
          { code: 'diqing', name: '迪庆州' }
        ]
      }
    ]
  },
  // 新疆维吾尔自治区
  {
    code: 'xj',
    name: '新疆维吾尔自治区',
    children: [
      {
        code: 'urumqi',
        name: '乌鲁木齐市',
        children: [
          { code: 'tianchi', name: '天山区' },
          { code: 'shazi', name: '沙依巴克区' },
          { code: 'xincun', name: '新市区' },
          { code: 'shuimu', name: '水磨沟区' },
          { code: 'hongshan', name: '红山区' }
        ]
      },
      {
        code: 'kashi',
        name: '喀什市',
        children: [
          { code: 'kashi', name: '喀什区' }
        ]
      },
      {
        code: 'akesu',
        name: '阿克苏市',
        children: [
          { code: 'akesu', name: '阿克苏区' }
        ]
      },
      {
        code: 'kuitun',
        name: '奎屯市',
        children: [
          { code: 'kuitun', name: '奎屯区' }
        ]
      },
      {
        code: 'tulufan',
        name: '吐鲁番市',
        children: [
          { code: 'tulufan', name: '吐鲁番区' }
        ]
      },
      {
        code: 'hami',
        name: '哈密市',
        children: [
          { code: 'hami', name: '哈密区' }
        ]
      },
      {
        code: 'hetian',
        name: '和田市',
        children: [
          { code: 'hetian', name: '和田区' }
        ]
      },
      {
        code: 'ayding',
        name: '阿图什市',
        children: [
          { code: 'ayding', name: '阿图什区' }
        ]
      },
      {
        code: 'kezile',
        name: '克孜勒苏柯尔克孜自治州',
        children: [
          { code: 'kezile', name: '克州' }
        ]
      },
      {
        code: 'changji',
        name: '昌吉回族自治州',
        children: [
          { code: 'changji', name: '昌吉州' }
        ]
      },
      {
        code: 'boertai',
        name: '博尔塔拉蒙古自治州',
        children: [
          { code: 'boertai', name: '博州' }
        ]
      },
      {
        code: 'tacheng',
        name: '塔城地区',
        children: [
          { code: 'tacheng', name: '塔城地区' }
        ]
      },
      {
        code: 'alei',
        name: '阿勒泰地区',
        children: [
          { code: 'alei', name: '阿勒泰地区' }
        ]
      },
      {
        code: 'kunming',
        name: '昆明市',
        children: [
          { code: 'wuhua', name: '五华区' },
          { code: 'nujiang', name: 'Nujiang区' }
        ]
      },
      {
        code: 'shihezi',
        name: '石河子市',
        children: [
          { code: 'shihezi', name: '石河子区' }
        ]
      },
      {
        code: 'aybag',
        name: '阿拉尔市',
        children: [
          { code: 'aybag', name: '阿拉尔区' }
        ]
      },
      {
        code: 'tuoxian',
        name: '图木舒克市',
        children: [
          { code: 'tuoxian', name: '图木舒克区' }
        ]
      },
      {
        code: 'wujiaquan',
        name: '五家渠市',
        children: [
          { code: 'wujiaquan', name: '五家渠区' }
        ]
      },
      {
        code: 'feizhu',
        name: '北屯市',
        children: [
          { code: 'feizhu', name: '北屯区' }
        ]
      },
      {
        code: 'songzi',
        name: '双河市',
        children: [
          { code: 'songzi', name: '双河区' }
        ]
      },
      {
        code: 'tiegan',
        name: '铁门关市',
        children: [
          { code: 'tiegan', name: '铁门关区' }
        ]
      }
    ]
  },
  // 西藏自治区
  {
    code: 'xz',
    name: '西藏自治区',
    children: [
      {
        code: 'lasa',
        name: '拉萨市',
        children: [
          { code: 'lasa', name: '城关区' },
          { code: 'lasa', name: '林周县' }
        ]
      },
      {
        code: 'shigatse',
        name: '日喀则市',
        children: [
          { code: 'xian', name: '县' }
        ]
      },
      {
        code: 'chagyi',
        name: '昌都区',
        children: [
          { code: 'chagyi', name: '昌都区' }
        ]
      },
      {
        code: 'linzhi',
        name: '林芝市',
        children: [
          { code: 'linzhi', name: '林芝区' }
        ]
      },
      {
        code: 'shannan',
        name: '山南市',
        children: [
          { code: 'shannan', name: '山南区' }
        ]
      },
      {
        code: 'naluo',
        name: '那曲市',
        children: [
          { code: 'naluo', name: '那曲区' }
        ]
      },
      {
        code: 'rangtang',
        name: '亚东县',
        children: [
          { code: 'rangtang', name: '亚东县' }
        ]
      },
      {
        code: 'ganden',
        name: '岗巴县',
        children: [
          { code: 'ganden', name: '岗巴县' }
        ]
      },
      {
        code: 'motuo',
        name: '墨脱县',
        children: [
          { code: 'motuo', name: '墨脱县' }
        ]
      },
      {
        code: 'bomi',
        name: '白摩县',
        children: [
          { code: 'bomi', name: '白摩县' }
        ]
      }
    ]
  },
  // 河南省
  {
    code: 'hn',
    name: '河南省',
    children: [
      {
        code: 'zhengzhou',
        name: '郑州市',
        children: [
          { code: 'erqi', name: '二七区' },
          { code: 'zhongyuan', name: '中原区' },
          { code: 'jinshui', name: '金水区' },
          { code: 'huiji', name: '惠济区' },
          { code: 'zhongmiao', name: '中牟县' }
        ]
      },
      {
        code: 'kaifeng',
        name: '开封市',
        children: [
          { code: 'longting', name: '龙亭区' },
          { code: 'shunhe', name: '顺河区' }
        ]
      },
      {
        code: 'luoyang',
        name: '洛阳市',
        children: [
          { code: 'laocheng', name: '老城区' },
          { code: 'xigong', name: '西工区' }
        ]
      },
      {
        code: 'pingdingshan',
        name: '平顶山市',
        children: [
          { code: 'zhongshan', name: '中山区' },
          { code: 'guandi', name: '关帝区' }
        ]
      },
      {
        code: 'anyang',
        name: '安阳市',
        children: [
          { code: 'wenfeng', name: '文峰区' },
          { code: 'beiguan', name: '北关区' }
        ]
      },
      {
        code: 'hebi',
        name: '鹤壁市',
        children: [
          { code: 'shanxian', name: '山县' },
          { code: 'biyang', name: '泌阳县' }
        ]
      },
      {
        code: 'xinxiang',
        name: '新乡市',
        children: [
          { code: 'weibin', name: '卫滨区' },
          { code: 'fengquan', name: '凤泉区' }
        ]
      },
      {
        code: 'jiaozuo',
        name: '焦作市',
        children: [
          { code: 'shanzhou', name: '山州区' },
          { code: 'jiaozuo', name: '焦作区' }
        ]
      },
      {
        code: 'puyang',
        name: '濮阳市',
        children: [
          { code: 'fanxian', name: '范县' },
          { code: 'puyang', name: '濮阳县' }
        ]
      },
      {
        code: 'xuchang',
        name: '许昌市',
        children: [
          { code: 'xuchang', name: '许昌区' },
          { code: 'xuchang', name: '鄢陵县' }
        ]
      },
      {
        code: 'luo',
        name: '漯河市',
        children: [
          { code: 'yuanling', name: '源陵区' },
          { code: 'yuanling', name: '源陵区' }
        ]
      },
      {
        code: 'sanmenxia',
        name: '三门峡市',
        children: [
          { code: 'huibin', name: '会宾区' },
          { code: 'sanmenxia', name: '三门峡区' }
        ]
      },
      {
        code: 'nanyang',
        name: '南阳市',
        children: [
          { code: 'zhangning', name: '张宁县' },
          { code: 'nanyang', name: '南阳区' }
        ]
      },
      {
        code: 'shangqiu',
        name: '商丘市',
        children: [
          { code: 'liangyuan', name: '梁园区' },
          { code: 'ningling', name: '宁陵县' }
        ]
      },
      {
        code: 'xinyang',
        name: '信阳市',
        children: [
          { code: 'shanxian', name: '山县' },
          { code: 'xinyang', name: '浉河区' }
        ]
      },
      {
        code: 'zhoukou',
        name: '周口市',
        children: [
          { code: 'zhoukou', name: '周口区' },
          { code: 'huaiyang', name: '淮阳区' }
        ]
      },
      {
        code: 'heze',
        name: '菏泽市',
        children: [
          { code: 'heze', name: '菏泽区' },
          { code: 'yuncheng', name: '郓城县' }
        ]
      },
      {
        code: 'yanjiang',
        name: '延津县',
        children: [
          { code: 'yanjiang', name: '延津县' }
        ]
      }
    ]
  },
  // 湖北省
  {
    code: 'hub',
    name: '湖北省',
    children: [
      {
        code: 'wuhan',
        name: '武汉市',
        children: [
          { code: 'jianghan', name: '江汉区' },
          { code: 'jianghan', name: '江岸区' },
          { code: 'wuchang', name: '武昌区' },
          { code: 'hongshan', name: '洪山区' },
          { code: 'dongxihu', name: '东西湖区' }
        ]
      },
      {
        code: 'huangshi',
        name: '黄石市',
        children: [
          { code: 'huangshigang', name: '黄石港区' },
          { code: 'xialu', name: '下陆区' }
        ]
      },
      {
        code: 'shiyan',
        name: '十堰市',
        children: [
          { code: 'zhangwan', name: '张湾区' },
          { code: 'chaoyang', name: '朝阳区' }
        ]
      },
      {
        code: 'yichang',
        name: '宜昌市',
        children: [
          { code: 'xiling', name: '西陵区' },
          { code: 'wufeng', name: '五峰县' }
        ]
      },
      {
        code: 'xiaogan',
        name: '孝感市',
        children: [
          { code: 'xindian', name: '甸镇' },
          { code: 'xiaogan', name: '孝南区' }
        ]
      },
      {
        code: 'jingmen',
        name: '荆门市',
        children: [
          { code: 'dongbao', name: '东宝区' },
          { code: 'jingshan', name: '京山县' }
        ]
      },
      {
        code: 'xiangyang',
        name: '襄阳市',
        children: [
          { code: 'xiangcheng', name: '襄城区' },
          { code: 'xiangfan', name: '樊城区' }
        ]
      },
      {
        code: 'ezhou',
        name: '鄂州市',
        children: [
          { code: 'chengdong', name: '城东区' },
          { code: 'chengxi', name: '城西区' }
        ]
      },
      {
        code: 'jianping',
        name: '荆州市',
        children: [
          { code: 'shashan', name: '沙山区' },
          { code: 'beichuan', name: '北川区' }
        ]
      },
      {
        code: 'huanggang',
        name: '黄冈市',
        children: [
          { code: 'huangzhou', name: '黄州区' },
          { code: 'macheng', name: '麻城市' }
        ]
      },
      {
        code: 'xianning',
        name: '咸宁市',
        children: [
          { code: 'xianning', name: '咸安区' },
          { code: 'xianning', name: '嘉鱼县' }
        ]
      },
      {
        code: 'suizhou',
        name: '随州市',
        children: [
          { code: 'suizhou', name: '曾都区' },
          { code: 'suizhou', name: '随县' }
        ]
      },
      {
        code: 'enshi',
        name: '恩施土家族苗族自治州',
        children: [
          { code: 'enshi', name: '恩施市' },
          { code: 'liuan', name: '利川市' }
        ]
      },
      {
        code: 'xiantao',
        name: '仙桃市',
        children: [
          { code: 'xiantao', name: '仙桃区' }
        ]
      },
      {
        code: 'qianjiang',
        name: '潜江市',
        children: [
          { code: 'qianjiang', name: '潜江区' }
        ]
      },
      {
        code: 'tianmen',
        name: '天门市',
        children: [
          { code: 'tianmen', name: '天门区' }
        ]
      },
      {
        code: 'guangshui',
        name: '广水市',
        children: [
          { code: 'guangshui', name: '广水区' }
        ]
      }
    ]
  },
  // 湖南省
  {
    code: 'hn2',
    name: '湖南省',
    children: [
      {
        code: 'changsha',
        name: '长沙市',
        children: [
          { code: 'yuelu', name: '岳麓区' },
          { code: 'tianxin', name: '天心区' },
          { code: 'yuming', name: ' yukming区' },
          { code: 'kaifu', name: '开福区' },
          { code: 'wuzhong', name: '伍中区' }
        ]
      },
      {
        code: 'zhuzhou',
        name: '株洲市',
        children: [
          { code: 'hetang', name: '荷塘区' },
          { code: 'yanling', name: '炎陵县' }
        ]
      },
      {
        code: 'xiangtan',
        name: '湘潭市',
        children: [
          { code: 'xiangtan', name: '湘塘区' },
          { code: 'xiangtan', name: '湘潭县' }
        ]
      },
      {
        code: 'hengyang',
        name: '衡阳市',
        children: [
          { code: 'ningyuan', name: '宁远区' },
          { code: 'hengyang', name: '衡阳县' }
        ]
      },
      {
        code: 'shaoyang',
        name: '邵阳市',
        children: [
          { code: 'daxi', name: '大溪区' },
          { code: 'wugang', name: '武冈市' }
        ]
      },
      {
        code: 'yueyang',
        name: '岳阳市',
        children: [
          { code: 'yueyang', name: '岳阳楼区' },
          { code: 'junshan', name: '君山区' }
        ]
      },
      {
        code: 'changde',
        name: '常德市',
        children: [
          { code: 'wuling', name: '武陵区' },
          { code: 'taoyuan', name: '桃源县' }
        ]
      },
      {
        code: 'zhangjiajie',
        name: '张家界市',
        children: [
          { code: 'yongding', name: '永定区' },
          { code: 'cili', name: '慈利县' }
        ]
      },
      {
        code: 'chenzhou',
        name: '郴州市',
        children: [
          { code: 'beihu', name: '北湖区' },
          { code: 'suxian', name: '苏仙县' }
        ]
      },
      {
        code: 'yongzhou',
        name: '永州市',
        children: [
          { code: 'lingling', name: '零陵区' },
          { code: 'lingling', name: '冷水滩区' }
        ]
      },
      {
        code: 'huaihua',
        name: '怀化市',
        children: [
          { code: 'hede', name: '鹤城区' },
          { code: 'hongjiang', name: '洪江市' }
        ]
      },
      {
        code: 'loudi',
        name: '娄底市',
        children: [
          { code: 'loudi', name: '娄星区' },
          { code: 'shuangfeng', name: '双峰县' }
        ]
      },
      {
        code: 'xiangxi',
        name: '湘西土家族苗族自治州',
        children: [
          { code: 'xiangxi', name: '吉首市' },
          { code: 'guzhang', name: '古丈县' }
        ]
      }
    ]
  },
  // 香港特别行政区
  {
    code: 'xg',
    name: '香港特别行政区',
    children: [
      {
        code: 'xg',
        name: '香港特别行政区',
        children: [
          { code: 'hongkong', name: '香港岛' },
          { code: 'kowloon', name: '九龙' },
          { code: 'newterritories', name: '新界' }
        ]
      }
    ]
  },
  // 澳门特别行政区
  {
    code: 'am',
    name: '澳门特别行政区',
    children: [
      {
        code: 'am',
        name: '澳门特别行政区',
        children: [
          { code: 'macau', name: '澳门半岛' },
          { code: 'taipa', name: '氹仔岛' },
          { code: 'colanh', name: '路环岛' }
        ]
      }
    ]
  }
])

const fetchAddresses = async () => {
  loading.value = true
  try {
    const res = await getUserAddressList()
    if (res?.code === 200 && res?.data) {
      // 转换API返回的数据格式
      let list = res.data.map(item => ({
        id: item.id,
        userName: item.receiverName,
        mobile: item.receiverPhone,
        province: item.province,
        city: item.city,
        district: item.district,
        street: item.detailAddress,
        isDefault: item.isDefault === 1
      }))

      // 处理多个默认地址的情况：只保留第一个为默认
      let hasDefault = false
      list = list.map(item => {
        if (item.isDefault) {
          if (hasDefault) {
            item.isDefault = false  // 已经有默认地址了，这个设为非默认
          } else {
            hasDefault = true  // 标记已找到默认地址
          }
        }
        return item
      })

      // 将默认地址排在第一位
      addresses.value = list.sort((a, b) => b.isDefault - a.isDefault)
    }
  } catch (error) {
    ElMessage.error('获取地址列表失败')
  } finally {
    loading.value = false
  }
}

const formatAddress = (addr) => {
  return `${addr.province}${addr.city}${addr.district}${addr.street}`
}

const formatPhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const handleEdit = async (address) => {
  try {
    // 调用详情接口获取最新数据
    const res = await getUserAddressInfo(address.id)
    const addressDetail = res.data || res

    isEditMode.value = true
    editingAddressId.value = addressDetail.id

    // 保存原始数据副本（用于对比变化）
    originalFormData.value = {
      receiverName: addressDetail.receiverName,
      receiverPhone: addressDetail.receiverPhone,
      province: addressDetail.province,
      city: addressDetail.city,
      district: addressDetail.district,
      detailAddress: addressDetail.detailAddress
    }

    // 填充表单
    formData.value = {
      receiverName: addressDetail.receiverName,
      receiverPhone: addressDetail.receiverPhone,
      province: addressDetail.province,
      city: addressDetail.city,
      district: addressDetail.district,
      detailAddress: addressDetail.detailAddress,
      area: []
    }

    // 根据省市区名称查找code（用于地区选择器回显）
    formData.value.area = findAreaCodeByName(addressDetail.province, addressDetail.city, addressDetail.district)

    showAddDialog.value = true
  } catch (error) {
    ElMessage.error('获取地址详情失败')
  }
}

const handleDelete = async (address) => {
  try {
    await ElMessageBox.confirm('确定要删除该地址吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteUserAddress(address.id)
    addresses.value = addresses.value.filter(item => item.id !== address.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSetDefault = async (address) => {
  try {
    await setDefaultAddress(address.id)
    // 更新默认地址状态并重新排序
    addresses.value = addresses.value.map(item => ({
      ...item,
      isDefault: item.id === address.id
    })).sort((a, b) => b.isDefault - a.isDefault)
    ElMessage.success('设置默认地址成功')
  } catch (error) {
    ElMessage.error('设置默认地址失败')
  }
}

const handleAddAddress = () => {
  // 重置编辑模式状态
  isEditMode.value = false
  editingAddressId.value = null
  originalFormData.value = {}

  // 先重置表单数据
  formData.value = {
    receiverName: '',
    receiverPhone: '',
    province: '',
    city: '',
    district: '',
    detailAddress: '',
    area: []
  }
  areaValue.value = []

  // 再打开弹窗
  showAddDialog.value = true

  // 在下一个 tick 清除验证状态
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const onAreaChange = (value) => {
  // 更新 formData 中的 area 值
  formData.value.area = value || []

  if (value && value.length >= 1) {
    // 从 areaOptions 中查找对应的名称
    const province = findNameInOptions(areaOptions.value, value[0])
    formData.value.province = province || ''
  }
  if (value && value.length >= 2) {
    const city = findNameInOptions(areaOptions.value, value[1])
    formData.value.city = city || ''
  }
  if (value && value.length >= 3) {
    const district = findNameInOptions(areaOptions.value, value[2])
    formData.value.district = district || ''
  }
}

// 在选项中查找名称
const findNameInOptions = (options, code) => {
  for (const option of options) {
    if (option.code === code) {
      return option.name
    }
    if (option.children) {
      const childName = findNameInOptions(option.children, code)
      if (childName) return childName
    }
  }
  return ''
}

// 根据省市区名称查找code（用于编辑时地区选择器回显）
const findAreaCodeByName = (provinceName, cityName, districtName) => {
  for (const province of areaOptions.value) {
    if (province.name === provinceName) {
      for (const city of province.children || []) {
        if (city.name === cityName) {
          for (const district of city.children || []) {
            if (district.name === districtName) {
              return [province.code, city.code, district.code]
            }
          }
        }
      }
    }
  }
  return []
}

// 提取变化的字段（用于部分更新）
const getChangedFields = (original, current) => {
  const changes = { id: editingAddressId.value }  // id 必传
  const fields = ['receiverName', 'receiverPhone', 'province', 'city', 'district', 'detailAddress']
  let hasChanges = false

  for (const field of fields) {
    if (original[field] !== current[field]) {
      changes[field] = current[field]
      hasChanges = true
    }
  }

  return hasChanges ? changes : null
}

// 重置表单
const resetForm = () => {
  isEditMode.value = false
  editingAddressId.value = null
  originalFormData.value = {}
  formRef.value?.clearValidate()
  formData.value = {
    receiverName: '',
    receiverPhone: '',
    province: '',
    city: '',
    district: '',
    detailAddress: '',
    area: []
  }
  areaValue.value = []
}

// 弹窗关闭时重置表单
const handleDialogClose = () => {
  resetForm()
}

const handleConfirmAdd = async () => {
  // 验证必填项
  if (!formData.value.receiverName || !formData.value.receiverPhone || !formData.value.province || !formData.value.city || !formData.value.district || !formData.value.detailAddress || !formData.value.area || formData.value.area.length === 0) {
    ElMessage.warning('请填写完整地址信息')
    return
  }

  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(formData.value.receiverPhone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }

  try {
    // 提交时移除 area 字段，只提交 province, city, district
    const { area, ...addressData } = formData.value

    if (isEditMode.value) {
      // 编辑模式：提取变化字段进行部分更新
      const changes = getChangedFields(originalFormData.value, addressData)

      if (!changes) {
        ElMessage.info('没有修改任何内容')
        return
      }

      await updateUserAddress(changes)
      showAddDialog.value = false
      resetForm()
      await fetchAddresses()
      ElMessage.success('修改地址成功')
    } else {
      // 新增模式
      await addUserAddress(addressData)
      showAddDialog.value = false
      resetForm()
      await fetchAddresses()
      ElMessage.success('添加地址成功')
    }
  } catch (error) {
    ElMessage.error(isEditMode.value ? '修改地址失败' : '添加地址失败')
  }
}

onMounted(() => {
  fetchAddresses()
})
</script>

<template>
  <div class="address-page">
    <div class="page-header">
      <div class="header-title">收货地址</div>
      <el-button type="primary" :icon="Plus" size="small" @click="handleAddAddress">
        新增地址
      </el-button>
    </div>

    <div class="address-list">
      <div v-if="loading" class="content-wrapper">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="addresses.length === 0" class="content-wrapper empty-wrapper">
        <div class="empty-icon">
          <el-icon :size="64" color="#dcdde6"><Location /></el-icon>
        </div>
        <p class="empty-text">暂无收货地址</p>
        <p class="empty-tip">添加地址，购物更快捷</p>
        <el-button type="primary" :icon="Plus" round @click="handleAddAddress">
          添加地址
        </el-button>
      </div>

      <div v-for="address in addresses" :key="address.id" class="address-card">
        <div class="card-header">
          <span v-if="address.isDefault" class="default-tag">默认</span>
          <span class="receiver">{{ address.userName }}</span>
          <span class="phone">{{ formatPhone(address.mobile) }}</span>
        </div>

        <div class="card-body">
          <div class="address-detail">{{ formatAddress(address) }}</div>
        </div>

        <div class="card-footer">
          <el-button
            size="small"
            text
            type="primary"
            :icon="Edit"
            @click="handleEdit(address)"
          >
            编辑
          </el-button>
          <el-button
            size="small"
            text
            type="danger"
            :icon="Delete"
            @click="handleDelete(address)"
          >
            删除
          </el-button>
          <el-button
            v-if="!address.isDefault"
            size="small"
            text
            type="primary"
            @click="handleSetDefault(address)"
          >
            设为默认
          </el-button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑地址弹窗 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEditMode ? '编辑地址' : '添加地址'"
      width="500px"
      :close-on-click-modal="false"
      :lock-scroll="false"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" label-width="90px" class="add-address-form">
        <el-form-item label="收件人" prop="receiverName" required>
          <el-input
            v-model="formData.receiverName"
            placeholder="请输入收件人姓名"
            maxlength="20"
          />
        </el-form-item>
        <el-form-item label="手机号" prop="receiverPhone" required>
          <el-input
            v-model="formData.receiverPhone"
            placeholder="请输入手机号"
            maxlength="11"
          />
        </el-form-item>
        <el-form-item label="所在地区" prop="area">
          <el-cascader
            v-model="formData.area"
            :options="areaOptions"
            placeholder="请选择省/市/区"
            :props="{ value: 'code', label: 'name', children: 'children' }"
            clearable
            filterable
            @change="onAreaChange"
          />
        </el-form-item>
        <el-form-item label="详细地址" prop="detailAddress" required>
          <el-input
            v-model="formData.detailAddress"
            type="textarea"
            :rows="3"
            placeholder="请输入详细地址"
            maxlength="200"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAdd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.address-page {
  padding-top: 40px;
  min-height: 100vh;
  background: #f5f5f5;
  padding-left: 20px;
  padding-right: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  width: 800px;
  max-width: 90%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.page-header .header-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.address-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 800px;
  max-width: 90%;
}

.content-wrapper {
  width: 800px;
  max-width: 90%;
}

.loading-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.empty-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-text {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
}

.empty-tip {
  margin: 0 0 20px;
  font-size: 14px;
  color: #9ca3af;
}

.address-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;
  width: 800px;
  max-width: 90%;
}

.address-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.default-tag {
  padding: 2px 8px;
  background: #e0f2fe;
  color: #0ea5e9;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.type-tag {
  padding: 2px 8px;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.receiver {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.phone {
  font-size: 13px;
  color: #6b7280;
}

.card-body {
  margin-bottom: 12px;
}

.address-detail {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
  word-break: break-word;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
}

.add-address-form {
  text-align: center;
  padding: 20px;
  color: #6b7280;
}
</style>
