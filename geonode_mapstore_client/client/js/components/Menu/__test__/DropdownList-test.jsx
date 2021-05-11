import React from 'react';
import ReactDOM from 'react-dom';
import expect from 'expect';
import DropdownList from '../DropdownList';


const item = {
    "labelId": "gnhome.maps",
    "type": "dropdown",
    "authenticated": true,
    "badge": "${mapsTotalCount}",
    "items": [
        {
            "type": "link",
            "href": "/maps/?limit=5",
            "labelId": "gnhome.exploreMaps"
        },
        {
            "type": "link",
            "href": "/maps/new",
            "labelId": "gnhome.createMap"
        }
    ]
};

const { id, label, labelId = '', items = [], style, image } = item;
const badgeValue = 3;

describe('Test GeoNode Dropdownlist', () => {

    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('Test componet is rendered', () => {
        ReactDOM.render( <DropdownList
            id={id}
            items={items}
            label={label}
            labelId={labelId}
            toogleStyle={style}
            toogleImage={image}
            dropdownClass={'dropdownClass'}
            badgeValue={badgeValue}

        />,

        document.getElementById("container"));
        const container = document.getElementById('container');
        const el = container.querySelector('.dropdownClass');
        expect(el).toExist();
        const badge = el.querySelector('.badge');
        expect(badge.innerHTML).toBe( '' + badgeValue);

    });


});
