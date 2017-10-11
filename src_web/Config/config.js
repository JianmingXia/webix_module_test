module.exports = (function () {
  debugger;
  let ret = {
    public_doc_quqi_id: 9,
    public_doc_tree_id: 1,
    public_doc_node_id: 100008,

    contacts_template_quqi_id: 9,
    contacts_template_tree_id: 1,
    contacts_template_node_id: 155151,

    public_preview_pagesizebig: 1430, // 在查阅状态下当页面小于1430px，左侧栏展示规则变化
    public_preview_pagesizesmall: 1130, // 在查阅状态下当页面大于1130px，左侧栏展示规则变化

    quqi_company_type: 2,
    wechat_passport_type: 4,
  };

  // 本地开发  这些地址可以自己配置
  if (IS_DEV) {
    ret = {
      public_doc_quqi_id: 9,
      public_doc_tree_id: 1,
      public_doc_node_id: 1,

      contacts_template_quqi_id: 9,
      contacts_template_tree_id: 1,
      contacts_template_node_id: 4,

      public_preview_pagesizebig: 1430, // 在查阅状态下当页面小于1430px，左侧栏展示规则变化
      public_preview_pagesizesmall: 1130, // 在查阅状态下当页面大于1130px，左侧栏展示规则变化

      quqi_company_type: 2, //曲奇公司种类
      wechat_passport_type: 4, //微信二级账号
    }
  }
  return ret;
})();
